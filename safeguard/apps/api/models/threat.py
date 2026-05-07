from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class ThreatSignal(BaseModel):
    user_id: UUID
    module: str # 'm1'|'m2'
    signal_type: str # 'audio'|'motion'|'eta'|'zone_exit'
    confidence: float
    lat: float
    lng: float

class ThreatResponse(BaseModel):
    threat_score: int
    action: str # 'monitor'|'ping_user'|'auto_sos'
    sos_event_id: Optional[UUID] = None

class RiskQuery(BaseModel):
    destination: str # "lat,lng"
    time: str # "HH:MM"
    user_id: UUID

class RiskResponse(BaseModel):
    risk_score: int
    risk_label: str
    reasoning: str
    safe_alternative: Optional[str] = None
    nearby_safe_zones: Optional[list] = None
