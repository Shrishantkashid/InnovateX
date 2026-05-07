from fastapi import APIRouter, Depends
from typing import List
from models.zones import GeoZone
from models.user import TokenData
from utils.auth import get_current_user

router = APIRouter(prefix="/api/zones", tags=["Geo-Fencing"])

@router.get("/", response_model=List[GeoZone])
async def get_zones(current_user: TokenData = Depends(get_current_user)):
    # Mock data for demonstration
    return [
        GeoZone(
            id="sz-1",
            name="Central Police Station",
            type="safe",
            latitude=18.5204,
            longitude=73.8567,
            radius=500,
            description="Highly secured zone with 24/7 patrol",
            risk_score=5
        ),
        GeoZone(
            id="uz-1",
            name="High-Risk Alleyways",
            type="unsafe",
            latitude=18.5150,
            longitude=73.8500,
            radius=400,
            description="Unlit area with high incident reports",
            risk_score=92
        ),
        GeoZone(
            id="cz-1",
            name="Construction Area",
            type="caution",
            latitude=18.5250,
            longitude=73.8600,
            radius=300,
            description="Restricted entry, proceed with caution",
            risk_score=45
        )
    ]
