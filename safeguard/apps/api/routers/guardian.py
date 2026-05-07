from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models.guardian import LinkedChildInfo
from models.user import TokenData
from utils.auth import get_current_user
from database import get_supabase

router = APIRouter(prefix="/api/guardian", tags=["Guardian"])

@router.get("/children", response_model=List[LinkedChildInfo])
async def get_linked_children(current_user: TokenData = Depends(get_current_user)):
    if current_user.role != 'parent':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only parents can access this dashboard"
        )
    
    supabase = get_supabase()
    
    # In a real app, we would query a 'guardian_links' table or child_profiles
    # For this hackathon demo, we query profiles with role 'child'
    result = supabase.table("profiles").select("*").eq("role", "child").execute()
    
    children = []
    for p in result.data:
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
    supabase = get_supabase()
    result = supabase.table("sos_events").select("*").eq("user_id", child_id).order("created_at", desc=True).execute()
    return result.data
