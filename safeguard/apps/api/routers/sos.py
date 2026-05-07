from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import uuid4
from ..models.sos import SOSCreate, SOSResponse, LocationPing, SOSResolve
from ..models.user import TokenData
from ..utils.auth import get_current_user
from ..database import get_supabase
import secrets

router = APIRouter(prefix="/api", tags=["SOS & Location"])

@router.post("/sos", response_model=SOSResponse)
async def create_sos(sos: SOSCreate, current_user: TokenData = Depends(get_current_user)):
    supabase = get_supabase()
    
    # 1. Generate track token
    track_token = secrets.token_urlsafe(8)
    
    # 2. Insert into sos_events table
    # Note: In a real scenario, we'd handle the base64 audio upload here to Supabase Storage
    sos_data = {
        "user_id": str(sos.user_id),
        "lat": sos.lat,
        "lng": sos.lng,
        "trigger_type": sos.trigger_type,
        "threat_score": sos.threat_score,
        "track_token": track_token,
        "resolved": False
    }
    
    result = supabase.table("sos_events").insert(sos_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create SOS event")
    
    sos_event_id = result.data[0]["id"]
    
    # 3. TODO: Queue notifications (Twilio, Push)
    # 4. TODO: Ping guardian network (PostGIS query)
    
    return SOSResponse(
        sos_event_id=sos_event_id,
        track_token=track_token,
        track_url=f"https://safeguard.app/track/{track_token}",
        notifications_queued=3 # Placeholder
    )

@router.post("/location")
async def stream_location(ping: LocationPing, current_user: TokenData = Depends(get_current_user)):
    supabase = get_supabase()
    
    ping_data = {
        "user_id": str(ping.user_id),
        "sos_event_id": str(ping.sos_event_id),
        "lat": ping.lat,
        "lng": ping.lng,
        "accuracy": ping.accuracy
    }
    
    result = supabase.table("location_pings").insert(ping_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log location ping")
        
    return {"received": True}

@router.patch("/sos/{sos_id}/resolve")
async def resolve_sos(sos_id: str, resolution: SOSResolve):
    supabase = get_supabase()
    
    update_data = {
        "resolved": True,
        # "resolved_by": resolution.resolved_by, # If schema supports it
        # "notes": resolution.notes
    }
    
    result = supabase.table("sos_events").update(update_data).eq("id", sos_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="SOS event not found")
        
    return {"resolved": True}
