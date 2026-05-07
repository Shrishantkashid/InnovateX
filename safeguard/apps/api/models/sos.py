from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class SOSBase(BaseModel):
    user_id: Optional[UUID] = None
    lat: float
    lng: float
    trigger_type: str  # 'audio'|'motion'|'eta'|'squeeze'|'manual'|'zone_exit'
    threat_score: int
    audio_clip_b64: Optional[str] = None

class SOSCreate(SOSBase):
    pass

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
    resolved_by: str # 'user'|'admin'
    notes: Optional[str] = None
