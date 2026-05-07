from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class GuardianLinkBase(BaseModel):
    guardian_id: UUID
    child_id: UUID
    status: str = "active" # active, pending, revoked

class GuardianLinkResponse(GuardianLinkBase):
    id: UUID
    created_at: datetime
    child_name: Optional[str] = None
    child_last_seen: Optional[datetime] = None
    child_status: str = "secure" # secure, warning, emergency

class LinkedChildInfo(BaseModel):
    id: UUID
    name: str
    unique_id: str
    status: str # secure, warning, emergency
    last_location: Optional[dict] = None
    battery_level: int = 100
    is_online: bool = True
