from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AlertStep(BaseModel):
    id: str
    label: str
    status: str # pending, success, failed, retrying
    channel: str # sms, whatsapp, push, authority
    recipient: str
    timestamp: datetime
    retry_count: int = 0

class SOSStatusResponse(BaseModel):
    sos_id: str
    current_level: int # 1, 2, 3
    status: str # active, resolved
    steps: List[AlertStep]
    risk_score: int
