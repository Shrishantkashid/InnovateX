from fastapi import APIRouter, Depends, Query
from ..models.user import TokenData
from ..database import get_supabase
from typing import Optional, List
from ..utils.auth import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin & Authority"])

@router.get("/incidents")
async def get_all_incidents(
    resolved: Optional[bool] = Query(None),
    current_user: TokenData = Depends(require_role(["admin"]))
):
    supabase = get_supabase()
    query = supabase.table("sos_events").select("*, users(full_name)")
    
    if resolved is not None:
        query = query.eq("resolved", resolved)
        
    result = query.execute()
    return {"incidents": result.data}

@router.get("/heatmap")
async def get_threat_heatmap(
    current_user: TokenData = Depends(check_role(["admin"]))
):
    supabase = get_supabase()
    
    # 1. Fetch all active or recent SOS coordinates
    result = supabase.table("sos_events").select("lat, lng, threat_score").execute()
    
    if not result.data:
        return {"clusters": []}

    # 2. DBSCAN Clustering Logic (Placeholder)
    # In production, use sklearn.cluster.DBSCAN
    # clusters = DBSCAN(eps=0.01, min_samples=2).fit(coords)
    
    # Mock clusters for now
    clusters = [
        {
            "center": {"lat": 12.9716, "lng": 77.5946},
            "radius": 500,
            "intensity": 0.8,
            "incident_count": len(result.data)
        }
    ]
    
    return {"clusters": clusters}
