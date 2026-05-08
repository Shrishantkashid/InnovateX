from fastapi import APIRouter, Depends, Query
from models.user import TokenData
from database import get_db
from typing import Optional
from utils.auth import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin & Authority"])

@router.get("/incidents")
async def get_all_incidents(
    resolved: Optional[bool] = Query(None),
    current_user: TokenData = Depends(require_role(["admin"]))
):
    db = get_db()
    
    pipeline = []
    if resolved is not None:
        pipeline.append({"$match": {"resolved": resolved}})
        
    pipeline.append({
        "$lookup": {
            "from": "profiles",
            "localField": "user_id",
            "foreignField": "_id",
            "as": "profiles_array"
        }
    })
    
    # Format to match Supabase's nested object structure
    pipeline.append({
        "$addFields": {
            "profiles": {
                "$cond": {
                    "if": {"$gt": [{"$size": "$profiles_array"}, 0]},
                    "then": {"full_name": {"$arrayElemAt": ["$profiles_array.full_name", 0]}},
                    "else": None
                }
            }
        }
    })
    pipeline.append({"$project": {"profiles_array": 0}})
    
    cursor = db.sos_events.aggregate(pipeline)
    incidents = await cursor.to_list(length=100)
    return {"incidents": incidents}

@router.get("/heatmap")
async def get_threat_heatmap(
    current_user: TokenData = Depends(require_role(["admin"]))
):
    db = get_db()
    
    # 1. Fetch all active or recent SOS coordinates
    cursor = db.sos_events.find({}, {"lat": 1, "lng": 1, "threat_score": 1})
    events = await cursor.to_list(length=100)
    
    if not events:
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
            "incident_count": len(events)
        }
    ]
    
    return {"clusters": clusters}
