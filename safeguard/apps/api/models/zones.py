from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class GeoZone(BaseModel):
    id: str
    name: str
    type: str # safe, unsafe, caution
    latitude: float
    longitude: float
    radius: float # in meters
    description: Optional[str] = None
    risk_score: int = 0 # 0-100
