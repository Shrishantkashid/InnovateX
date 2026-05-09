"""
SafeGuard AI Engine — Main FastAPI Service
Exposes internal AI scoring endpoints consumed by the backend API (Dev 2).

Endpoints:
    POST /ai/score          — Threat fusion scoring
    POST /ai/route-risk     — Route risk assessment (Groq Llama 3.1)
    POST /ai/grooming-score — Grooming pattern classification
    POST /ai/behaviour-delta— Behaviour anomaly detection
    GET  /ai/heatmap        — DBSCAN cluster results
    POST /ai/digest         — Weekly digest generation
    POST /ai/coach          — Conversation coaching
    GET  /ai/health         — Health check
"""

import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from config import GROQ_API_KEY
from threat_fusion import ThreatSignal, ThreatResult, compute_threat_score
from route_risk import RouteRiskRequest, RouteRiskResponse, score_route_risk
from grooming_classifier import GroomingInput, GroomingResult, score_grooming_risk
from behaviour_tracker import BehaviourInput, BehaviourResult, analyse_behaviour
from heatmap_cluster import IncidentPoint, HeatmapResult, cluster_incidents
from digest_generator import (
    DigestInput,
    DigestResult,
    generate_weekly_digest,
    generate_conversation_coach,
)
from scheduler import start_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("SafeGuard AI Engine starting...")
    scheduler = start_scheduler()
    yield
    scheduler.shutdown()
    logger.info("SafeGuard AI Engine stopped.")


app = FastAPI(
    title="SafeGuard AI Engine",
    description="Internal AI scoring service for SafeGuard platform",
    version="1.0.0",
    lifespan=lifespan,
)


# ---- Health Check ----

@app.get("/ai/health")
async def health_check():
    """Health check endpoint for Railway/Docker."""
    return {
        "status": "healthy",
        "service": "safeguard-ai-engine",
        "groq_configured": bool(GROQ_API_KEY),
    }


# ---- Threat Fusion ----

@app.post("/ai/score", response_model=ThreatResult)
async def score_threat(signal: ThreatSignal):
    """
    Compute composite threat score from sensor signals.

    Combines audio, motion, ETA, and zone exit scores using weighted
    linear combination. Applies night-time penalty and module-specific thresholds.

    Returns composite score (0–100) and recommended action:
    - "monitor": no action needed
    - "ping_user": send confirmation ping
    - "auto_sos": fire SOS immediately
    """
    try:
        result = compute_threat_score(signal)
        logger.info(
            f"[THREAT] user={signal.user_id} module={signal.module} "
            f"score={result.composite_score} action={result.action}"
        )
        return result
    except Exception as e:
        logger.error(f"[THREAT] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Route Risk ----

@app.post("/ai/route-risk", response_model=RouteRiskResponse)
async def assess_route_risk(request: RouteRiskRequest):
    """
    Assess route safety using Groq Llama 3.1 + crime data + Google Places.

    Returns risk score (1–5), reasoning, safer alternative, and nearby safe zones.
    Latency target: < 2 seconds.
    """
    try:
        result = await score_route_risk(request)
        logger.info(
            f"[ROUTE_RISK] dest=({request.destination_lat},{request.destination_lng}) "
            f"time={request.time_of_day} score={result.risk_score}"
        )
        return result
    except Exception as e:
        logger.error(f"[ROUTE_RISK] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Grooming Classifier ----

@app.post("/ai/grooming-score", response_model=GroomingResult)
async def score_grooming(input_data: GroomingInput):
    """
    Score a contact for grooming patterns.

    Privacy-preserving: processes only metadata and flag types,
    never raw message text. MiniLM runs semantic similarity on
    flagged phrase categories.

    Returns grooming_score (0–1), flags, and whether to alert parent.
    """
    try:
        result = score_grooming_risk(input_data)
        logger.info(
            f"[GROOMING] child={input_data.child_id} contact={input_data.contact_hash[:8]}... "
            f"score={result.grooming_score} category={result.risk_category} "
            f"alert={result.alert_parent}"
        )
        return result
    except Exception as e:
        logger.error(f"[GROOMING] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Behaviour Tracker ----

@app.post("/ai/behaviour-delta", response_model=BehaviourResult)
async def analyse_behaviour_delta(input_data: BehaviourInput):
    """
    Analyse child's app usage against 4-week baseline.

    Flags metrics where |z_score| > 2.0 (2 standard deviations).
    Tracks: daily screen time, late-night frequency, app switching, new contacts.
    """
    try:
        result = analyse_behaviour(input_data)
        logger.info(
            f"[BEHAVIOUR] child={input_data.child_id} "
            f"delta={result.delta_score} anomalies={len(result.anomalies)}"
        )
        return result
    except Exception as e:
        logger.error(f"[BEHAVIOUR] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Heatmap Clustering ----

class HeatmapRequest(BaseModel):
    """Request body for on-demand heatmap clustering."""
    incidents: list[IncidentPoint]


@app.post("/ai/heatmap", response_model=HeatmapResult)
async def generate_heatmap(request: HeatmapRequest):
    """
    Run DBSCAN clustering on SOS incident locations.

    Parameters: eps=0.005 (~500m), min_samples=3.
    Returns cluster centroids, radii, and risk levels for authority map.
    Also runs nightly via cron.
    """
    try:
        result = cluster_incidents(request.incidents)
        logger.info(
            f"[HEATMAP] incidents={result.total_incidents} "
            f"clusters={len(result.clusters)} noise={result.noise_points}"
        )
        return result
    except Exception as e:
        logger.error(f"[HEATMAP] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Weekly Digest ----

@app.post("/ai/digest", response_model=DigestResult)
async def generate_digest(input_data: DigestInput):
    """
    Generate weekly parent digest using Groq Llama 3.1.

    Produces plain-English narrative + conversation starter.
    Tone: supportive, not alarmist.
    """
    try:
        result = await generate_weekly_digest(input_data)
        logger.info(
            f"[DIGEST] child={input_data.child_id} parent={input_data.parent_id} "
            f"risk={result.risk_category}"
        )
        return result
    except Exception as e:
        logger.error(f"[DIGEST] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Conversation Coach ----

class CoachRequest(BaseModel):
    """Request for conversation coaching."""
    child_age: int = Field(default=14, ge=8, le=17)
    concern_type: str  # e.g., "grooming_pattern", "excessive_screen_time", "nsfw_content"
    flags: list[str] = []
    risk_level: str = "moderate"


@app.post("/ai/coach")
async def get_conversation_coach(request: CoachRequest):
    """
    Generate conversation coaching for a parent.

    Tells parents HOW to talk to their child about detected concerns
    without breaking trust or revealing monitoring.
    """
    try:
        result = await generate_conversation_coach(
            child_age=request.child_age,
            concern_type=request.concern_type,
            flags=request.flags,
            risk_level=request.risk_level,
        )
        logger.info(f"[COACH] concern={request.concern_type} risk={request.risk_level}")
        return result
    except Exception as e:
        logger.error(f"[COACH] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Risk Synthesis (combines all Module 3 scores) ----

class RiskSynthesisRequest(BaseModel):
    """Combine all M3 scores into a single composite risk."""
    child_id: str
    grooming_score: float = Field(default=0.0, ge=0.0, le=1.0)
    behaviour_delta: float = Field(default=0.0, ge=0.0, le=100.0)
    content_score: float = Field(default=0.0, ge=0.0, le=1.0)


class RiskSynthesisResponse(BaseModel):
    """Composite risk output."""
    composite_risk: float = Field(..., ge=0.0, le=100.0)
    risk_category: str
    top_flags: list[str] = []


@app.post("/ai/risk-synthesis", response_model=RiskSynthesisResponse)
async def synthesize_risk(request: RiskSynthesisRequest):
    """
    Combine grooming_score + behaviour_delta + content_score into
    a single composite risk score (0–100).

    Weights: grooming 40%, behaviour 35%, content 25%.
    """
    # Normalize all to 0–100 scale
    grooming_normalized = request.grooming_score * 100
    behaviour_normalized = request.behaviour_delta  # Already 0–100
    content_normalized = request.content_score * 100

    composite = (
        grooming_normalized * 0.40
        + behaviour_normalized * 0.35
        + content_normalized * 0.25
    )
    composite = min(100.0, max(0.0, composite))

    # Determine category
    if composite >= 75:
        category = "critical"
    elif composite >= 50:
        category = "high"
    elif composite >= 30:
        category = "moderate"
    else:
        category = "low"

    # Identify top contributing flags
    top_flags = []
    if grooming_normalized > 50:
        top_flags.append("grooming_patterns_detected")
    if behaviour_normalized > 40:
        top_flags.append("behaviour_anomaly")
    if content_normalized > 50:
        top_flags.append("content_risk")

    return RiskSynthesisResponse(
        composite_risk=round(composite, 1),
        risk_category=category,
        top_flags=top_flags,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
