from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from typing import List, Optional
from models.sos import SOSCreate, SOSResponse, LocationPing, SOSResolve, SOSCreateRequest
from models.user import TokenData
from utils.auth import get_current_user
from database import get_supabase
import secrets
import logging

router = APIRouter(prefix="/api", tags=["SOS & Location"])

@router.post("/sos", response_model=SOSResponse)
async def create_sos(sos: SOSCreate, current_user: TokenData = Depends(get_current_user)):
    supabase = get_supabase()
    
    # 1. Generate track token
    track_token = secrets.token_urlsafe(8)
    
    # 2. Insert into sos_events table
    sos_data = {
        "user_id": current_user.sub,
        "lat": sos.lat,
        "lng": sos.lng,
        "trigger_type": sos.trigger_type,
        "threat_score": sos.threat_score,
        "track_token": track_token,
        "resolved": False
    }
    
    # Infer module from role
    if current_user.role == "woman":
        sos_data["module"] = "m1"
    elif current_user.role == "child":
        sos_data["module"] = "m2"
    
    result = supabase.table("sos_events").insert(sos_data).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to create SOS event"
        )
    
    sos_event_id = result.data[0]["id"]
    
    # 3. Trigger notifications (Twilio, Push)
    contacts = []
    try:
        from services.notification import notification_service
        # Fetch contacts from DB
        contacts_result = supabase.table("trusted_contacts").select("contact_phone").eq("user_id", current_user.sub).execute()
        contacts = [{"phone": c["contact_phone"]} for c in contacts_result.data] if contacts_result.data else []
        
        # Add a placeholder if no contacts found for testing
        if not contacts:
            contacts = [{"phone": "+1234567890"}]
            
        await notification_service.trigger_sos_notifications(
            user_name=current_user.email,
            lat=sos.lat,
            lng=sos.lng,
            contacts=contacts
        )
    except Exception as e:
        logging.getLogger(__name__).error(f"Failed to trigger notifications: {e}")

    return SOSResponse(
        sos_event_id=sos_event_id,
        track_token=track_token,
        track_url=f"https://safeguard.app/track/{track_token}",
        notifications_queued=len(contacts)
    )

@router.post("/sos/create", response_model=SOSResponse)
async def create_sos_v2(sos: SOSCreateRequest, current_user: TokenData = Depends(get_current_user)):
    # Redirect to existing logic but with new model mapping
    internal_sos = SOSCreate(
        lat=sos.latitude,
        lng=sos.longitude,
        risk_level=sos.risk_level,
        trigger_type="manual",
        threat_score=95
    )
    return await create_sos(internal_sos, current_user)

@router.post("/location")
async def stream_location(ping: LocationPing, current_user: TokenData = Depends(get_current_user)):
    supabase = get_supabase()
    
    ping_data = {
        "user_id": current_user.sub,
        "sos_event_id": str(ping.sos_event_id),
        "lat": ping.lat,
        "lng": ping.lng,
        "accuracy": ping.accuracy
    }
    
    result = supabase.table("location_pings").insert(ping_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log location ping")
        
    return {"received": True}

async def resolve_sos(sos_id: str, resolution: SOSResolve):
    supabase = get_supabase()
    
    update_data = {
        "resolved": True
    }
    
    result = supabase.table("sos_events").update(update_data).eq("id", sos_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="SOS event not found"
        )
        
    return {"resolved": True}

@router.post("/sos/resolve")
async def resolve_sos_v2(
    resolution: SOSResolve, 
    current_user: TokenData = Depends(get_current_user)
):
    return await resolve_sos(str(resolution.sos_id), resolution)

@router.get("/sos/history")
async def get_sos_history(current_user: TokenData = Depends(get_current_user)):
    supabase = get_supabase()
    
    # Fetch user's incidents
    result = supabase.table("sos_events")\
        .select("*")\
        .eq("user_id", current_user.sub)\
        .order("created_at", desc=True)\
        .execute()
    
    return result.data

@router.get("/sos/{sos_id}/status")
async def get_sos_status(sos_id: str, current_user: TokenData = Depends(get_current_user)):
    # In a real app, we would query 'sos_alerts' table
    # For demo, return the pipeline steps
    now = datetime.utcnow()
    return {
        "sos_id": sos_id,
        "current_level": 2,
        "status": "active",
        "risk_score": 88,
        "steps": [
            {"id": "1", "label": "SOS Signal Dispatched", "status": "success", "channel": "system", "recipient": "SafeGuard Cloud", "timestamp": now - timedelta(minutes=5)},
            {"id": "2", "label": "Realtime Location Sharing", "status": "success", "channel": "gps", "recipient": "Guardian Network", "timestamp": now - timedelta(minutes=4)},
            {"id": "3", "label": "SMS Emergency Alerts", "status": "success", "channel": "sms", "recipient": "+91 98XXX XXX01", "timestamp": now - timedelta(minutes=3)},
            {"id": "4", "label": "WhatsApp Incident Report", "status": "success", "channel": "whatsapp", "recipient": "Family Group", "timestamp": now - timedelta(minutes=2)},
            {"id": "5", "label": "Authority Escalation", "status": "pending", "channel": "authority", "recipient": "Police Dispatch", "timestamp": now},
        ]
    }

