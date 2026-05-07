"""
SafeGuard AI Engine — Threat Fusion Engine
Weighted linear combination of audio, motion, ETA, and zone exit signals.
Produces a composite threat score (0–100) and recommended action.
"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

from config import (
    WEIGHT_AUDIO,
    WEIGHT_MOTION,
    WEIGHT_ETA,
    WEIGHT_ZONE_EXIT,
    NIGHT_START_HOUR,
    NIGHT_END_HOUR,
    NIGHT_PENALTY,
    M1_MONITOR_MAX,
    M1_PING_MAX,
    M2_MONITOR_MAX,
    M2_PING_MAX,
)


class ThreatSignal(BaseModel):
    """Input signal from on-device sensors."""
    user_id: str
    module: str = Field(..., pattern="^(m1|m2)$")
    audio_score: float = Field(default=0.0, ge=0.0, le=100.0)
    motion_score: float = Field(default=0.0, ge=0.0, le=100.0)
    eta_score: float = Field(default=0.0, ge=0.0, le=100.0)
    zone_exit_score: float = Field(default=0.0, ge=0.0, le=100.0)
    lat: Optional[float] = None
    lng: Optional[float] = None
    timestamp: Optional[datetime] = None


class ThreatResult(BaseModel):
    """Output of the threat fusion engine."""
    composite_score: int = Field(..., ge=0, le=100)
    action: str  # "monitor" | "ping_user" | "auto_sos"
    breakdown: dict


def _is_night_hour(hour: int) -> bool:
    """Check if the given hour falls in the high-risk night window."""
    if NIGHT_START_HOUR > NIGHT_END_HOUR:
        # Wraps around midnight (e.g., 22–5)
        return hour >= NIGHT_START_HOUR or hour < NIGHT_END_HOUR
    return NIGHT_START_HOUR <= hour < NIGHT_END_HOUR


def compute_threat_score(signal: ThreatSignal) -> ThreatResult:
    """
    Compute composite threat score using weighted linear combination.

    Algorithm:
        composite = (audio * 0.40) + (motion * 0.25) + (eta * 0.20) + (zone_exit * 0.15)
        + night penalty (+15 if 10pm–5am)
        Module 2 (child) uses lower action thresholds.
    """
    # Weighted combination
    raw_score = (
        signal.audio_score * WEIGHT_AUDIO
        + signal.motion_score * WEIGHT_MOTION
        + signal.eta_score * WEIGHT_ETA
        + signal.zone_exit_score * WEIGHT_ZONE_EXIT
    )

    # Time-of-day penalty
    now = signal.timestamp or datetime.utcnow()
    night_bonus = NIGHT_PENALTY if _is_night_hour(now.hour) else 0
    raw_score += night_bonus

    # Clamp to 0–100
    composite_score = int(min(100, max(0, round(raw_score))))

    # Determine action based on module thresholds
    if signal.module == "m2":
        monitor_max = M2_MONITOR_MAX
        ping_max = M2_PING_MAX
    else:
        monitor_max = M1_MONITOR_MAX
        ping_max = M1_PING_MAX

    if composite_score <= monitor_max:
        action = "monitor"
    elif composite_score <= ping_max:
        action = "ping_user"
    else:
        action = "auto_sos"

    breakdown = {
        "audio_contribution": round(signal.audio_score * WEIGHT_AUDIO, 2),
        "motion_contribution": round(signal.motion_score * WEIGHT_MOTION, 2),
        "eta_contribution": round(signal.eta_score * WEIGHT_ETA, 2),
        "zone_exit_contribution": round(signal.zone_exit_score * WEIGHT_ZONE_EXIT, 2),
        "night_penalty": night_bonus,
        "module": signal.module,
    }

    return ThreatResult(
        composite_score=composite_score,
        action=action,
        breakdown=breakdown,
    )
