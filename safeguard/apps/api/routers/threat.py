from fastapi import APIRouter, HTTPException, Depends
from models.threat import ThreatSignal, ThreatResponse, RiskResponse
from services.threat_engine import threat_engine
from database import get_supabase
from utils.auth import get_current_user
from models.user import TokenData

router = APIRouter(prefix="/api", tags=["Threat & AI"])

@router.post("/threat", response_model=ThreatResponse)
async def process_threat_signal(
    signal: ThreatSignal,
    current_user: TokenData = Depends(get_current_user)
):
    # Prepare signals for the engine
    signals = [{"type": signal.signal_type, "value": signal.confidence}]
    
    # Calculate score using the engine
    threat_score = threat_engine.calculate_threat_score(signal.module, signals)
    action = threat_engine.determine_action(threat_score)
    
    # In a real app, we might check for existing SOS events or 
    # persistent signals in Redis/DB here.
        
    return ThreatResponse(
        threat_score=threat_score,
        action=action,
        sos_event_id=None
    )

@router.get("/risk", response_model=RiskResponse)
async def get_route_risk(
    destination: str, 
    time: str, 
    current_user: TokenData = Depends(get_current_user)
):
    # GPT-4o-mini logic would go here
    # Placeholder response
    return RiskResponse(
        risk_score=2,
        risk_label="Low",
        reasoning="Area is well-lit and has frequent patrols at this hour.",
        safe_alternative="Main road route is recommended.",
        nearby_safe_zones=[{"name": "Central Police Station", "lat": 12.97, "lng": 77.59}]
    )
