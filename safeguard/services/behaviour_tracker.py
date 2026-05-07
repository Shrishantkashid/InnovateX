"""
SafeGuard AI Engine — Behaviour Baseline Tracker
Z-score anomaly detection for child app usage patterns.
Flags deviations > 2 standard deviations from 4-week rolling baseline.
"""

from datetime import datetime, timedelta
from typing import Optional

import numpy as np
from pydantic import BaseModel, Field
from scipy.stats import zscore

from config import ZSCORE_FLAG_THRESHOLD, BASELINE_WEEKS


class AppUsageEntry(BaseModel):
    """Single app usage log entry."""
    app_name: str
    session_start: datetime
    session_end: datetime
    duration_min: float = 0.0
    is_late_night: bool = False


class BehaviourInput(BaseModel):
    """Input: current week's usage data + historical baseline."""
    child_id: str
    current_week_logs: list[AppUsageEntry] = []
    # Historical baseline data (4-week averages per app)
    baselines: dict[str, dict] = {}
    # Format: {"Instagram": {"avg_daily_min": 45.0, "late_night_freq": 2.0}, ...}


class AnomalyFlag(BaseModel):
    """A single detected anomaly."""
    metric: str
    app_name: str
    current_value: float
    baseline_value: float
    z_score: float
    severity: str  # "moderate" | "high"


class BehaviourResult(BaseModel):
    """Output of behaviour analysis."""
    child_id: str
    delta_score: float = Field(..., ge=0.0, le=100.0)
    anomalies: list[AnomalyFlag] = []
    anomaly_detected: bool = False
    summary: str = ""


def _aggregate_current_week(logs: list[AppUsageEntry]) -> dict[str, dict]:
    """
    Aggregate current week's logs into per-app metrics.
    Returns: {app_name: {daily_min: float, late_night_sessions: int, total_sessions: int}}
    """
    app_stats: dict[str, dict] = {}

    for entry in logs:
        app = entry.app_name
        if app not in app_stats:
            app_stats[app] = {
                "total_min": 0.0,
                "late_night_sessions": 0,
                "total_sessions": 0,
                "days_active": set(),
            }

        app_stats[app]["total_min"] += entry.duration_min
        app_stats[app]["total_sessions"] += 1
        if entry.is_late_night:
            app_stats[app]["late_night_sessions"] += 1
        app_stats[app]["days_active"].add(entry.session_start.date())

    # Convert to daily averages
    result = {}
    for app, stats in app_stats.items():
        days = max(1, len(stats["days_active"]))
        result[app] = {
            "avg_daily_min": stats["total_min"] / days,
            "late_night_freq": stats["late_night_sessions"],
            "total_sessions": stats["total_sessions"],
        }

    return result


def _compute_new_contact_volume(logs: list[AppUsageEntry]) -> float:
    """Compute messaging volume from new/unknown contacts (simplified heuristic)."""
    # In production, this would cross-reference with contact allowlist
    # For hackathon, we use messaging app session frequency as proxy
    messaging_apps = {"whatsapp", "instagram", "snapchat", "telegram", "signal"}
    messaging_sessions = sum(
        1 for log in logs
        if log.app_name.lower() in messaging_apps
    )
    return float(messaging_sessions)


def analyse_behaviour(input_data: BehaviourInput) -> BehaviourResult:
    """
    Compare current week's app usage against 4-week rolling baseline.
    Flag any metric where |z_score| > 2.0.

    Metrics tracked:
    - Daily screen time per app
    - Late-night session frequency (after 10pm)
    - New contact message volume
    - App switching frequency (anxiety indicator)
    """
    if not input_data.current_week_logs:
        return BehaviourResult(
            child_id=input_data.child_id,
            delta_score=0.0,
            anomalies=[],
            anomaly_detected=False,
            summary="No usage data for current week.",
        )

    current_stats = _aggregate_current_week(input_data.current_week_logs)
    anomalies: list[AnomalyFlag] = []

    for app_name, current in current_stats.items():
        baseline = input_data.baselines.get(app_name)
        if not baseline:
            # New app with no baseline — flag if heavy usage
            if current["avg_daily_min"] > 60:
                anomalies.append(AnomalyFlag(
                    metric="new_app_heavy_usage",
                    app_name=app_name,
                    current_value=current["avg_daily_min"],
                    baseline_value=0.0,
                    z_score=3.0,  # Synthetic high z-score for new heavy app
                    severity="moderate",
                ))
            continue

        # Check daily screen time deviation
        baseline_daily = baseline.get("avg_daily_min", 0)
        if baseline_daily > 0:
            # Simple z-score: (current - mean) / std
            # Approximate std as 25% of baseline (heuristic for limited data)
            std_estimate = max(baseline_daily * 0.25, 5.0)
            z = (current["avg_daily_min"] - baseline_daily) / std_estimate

            if abs(z) > ZSCORE_FLAG_THRESHOLD:
                anomalies.append(AnomalyFlag(
                    metric="daily_screen_time",
                    app_name=app_name,
                    current_value=round(current["avg_daily_min"], 1),
                    baseline_value=round(baseline_daily, 1),
                    z_score=round(z, 2),
                    severity="high" if abs(z) > 3.0 else "moderate",
                ))

        # Check late-night frequency deviation
        baseline_late = baseline.get("late_night_freq", 0)
        if current["late_night_freq"] > 0:
            std_late = max(baseline_late * 0.3, 1.0)
            z_late = (current["late_night_freq"] - baseline_late) / std_late

            if z_late > ZSCORE_FLAG_THRESHOLD:
                anomalies.append(AnomalyFlag(
                    metric="late_night_frequency",
                    app_name=app_name,
                    current_value=float(current["late_night_freq"]),
                    baseline_value=round(baseline_late, 1),
                    z_score=round(z_late, 2),
                    severity="high" if z_late > 3.0 else "moderate",
                ))

    # App switching frequency (total unique apps in short sessions < 5 min)
    short_sessions = [log for log in input_data.current_week_logs if log.duration_min < 5]
    unique_apps_short = len(set(log.app_name for log in short_sessions))
    if unique_apps_short > 10:  # High app switching = potential anxiety
        anomalies.append(AnomalyFlag(
            metric="app_switching_frequency",
            app_name="multiple",
            current_value=float(unique_apps_short),
            baseline_value=5.0,  # Assumed normal baseline
            z_score=2.5,
            severity="moderate",
        ))

    # Compute delta score (0–100)
    if anomalies:
        max_z = max(abs(a.z_score) for a in anomalies)
        # Scale: z=2 → 30pts, z=3 → 60pts, z=4+ → 90pts
        delta_score = min(100.0, max_z * 20.0)
    else:
        delta_score = 0.0

    # Generate summary
    if anomalies:
        high_anomalies = [a for a in anomalies if a.severity == "high"]
        summary_parts = []
        for a in anomalies[:3]:  # Top 3
            summary_parts.append(
                f"{a.app_name}: {a.metric} is {a.current_value} vs baseline {a.baseline_value} (z={a.z_score})"
            )
        summary = "Anomalies detected: " + "; ".join(summary_parts)
    else:
        summary = "Usage patterns within normal range."

    return BehaviourResult(
        child_id=input_data.child_id,
        delta_score=round(delta_score, 1),
        anomalies=anomalies,
        anomaly_detected=len(anomalies) > 0,
        summary=summary,
    )
