from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class SOSBase(BaseModel):
    user_id: Optional[UUID] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    risk_level: str = "HIGH"
    trigger_type: str = "manual"  # 'audio'|'motion'|'eta'|'squeeze'|'manual'|'zone_exit'
    threat_score: int = 90
    audio_clip_b64: Optional[str] = None

class SOSCreate(SOSBase):
    pass

class SOSCreateRequest(BaseModel):
    latitude: float
    longitude: float
    risk_level: str = "HIGH"

class SOSResponse(BaseModel):
    sos_event_id: UUID
    track_token: str
    track_url: str
    notifications_queued: int

class LocationPing(BaseModel):
    user_id: Optional[UUID] = None
    sos_event_id: UUID
    lat: float
    lng: float
    accuracy: Optional[float] = None

class SOSResolve(BaseModel):
    sos_id: UUID
    resolution_notes: Optional[str] = None
    resolved_by: str = "user" # 'user'|'admin'
