from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class UsageLog(BaseModel):
    app: str
    start: datetime
    end: datetime

class BehaviourLog(BaseModel):
    child_id: UUID
    logs: List[UsageLog]

class ContactScore(BaseModel):
    child_id: UUID
    contact_hash: str
    grooming_score: float
    flags: List[str]

class DigestRequest(BaseModel):
    child_id: UUID
    parent_id: UUID

class DigestResponse(BaseModel):
    digest_id: UUID
    composite_risk: float
    narrative: str
    conversation_starter: str
    pdf_url: Optional[str] = None
