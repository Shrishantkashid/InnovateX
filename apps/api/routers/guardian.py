from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models.guardian import LinkedChildInfo
from models.user import TokenData
from utils.auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/guardian", tags=["Guardian"])

@router.get("/children", response_model=List[LinkedChildInfo])
async def get_linked_children(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != 'parent':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only parents can access this dashboard"
        )
    
    db = get_db()
    
    # In a real app, we would query a 'guardian_links' table or child_profiles
    # For this hackathon demo, we query profiles with role 'child'
    cursor = db.profiles.find({"role": "child"})
    profiles_data = await cursor.to_list(length=100)
    
    children = []
    for p in profiles_data:
        children.append(LinkedChildInfo(
            id=str(p['id']),
            name=p.get('full_name') or "Child User",
            unique_id=f"SG-{str(p['id'])[:4].upper()}", # Placeholder for child_id_tag
            status="secure",
            battery_level=85,
            is_online=True,
            last_location={"lat": 18.5204, "lng": 73.8567}
        ))
        
    return children

@router.get("/incidents/{child_id}")
async def get_child_incidents(child_id: str, current_user: TokenData = Depends(get_current_user)):
    db = get_db()
    cursor = db.sos_events.find({"user_id": child_id}).sort("created_at", -1)
    events = await cursor.to_list(length=100)
    return events
