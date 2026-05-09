from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from typing import List, Optional
from models.sos import SOSCreate, SOSResponse, LocationPing, SOSResolve, SOSCreateRequest
from models.user import TokenData
from utils.auth import get_current_user
from database import get_db
import uuid
import secrets
import logging

router = APIRouter(prefix="/api", tags=["SOS & Location"])

@router.post("/sos", response_model=SOSResponse)
async def create_sos(sos: SOSCreate, current_user: TokenData = Depends(get_current_user)):
    db = get_db()
    
    # 1. Generate track token
    track_token = secrets.token_urlsafe(8)
    sos_event_id = str(uuid.uuid4())
    
    # 2. Insert into sos_events table
    sos_data = {
        "_id": sos_event_id,
        "id": sos_event_id,
        "user_id": current_user.sub,
        "lat": sos.lat,
        "lng": sos.lng,
        "trigger_type": sos.trigger_type,
        "threat_score": sos.threat_score,
        "track_token": track_token,
        "resolved": False,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Infer module from role
    if current_user.role == "woman":
        sos_data["module"] = "m1"
    elif current_user.role == "child":
        sos_data["module"] = "m2"
    
    await db.sos_events.insert_one(sos_data)
    
    # 3. Trigger notifications (Twilio, Push)
    contacts = []
    try:
        from services.notification import notification_service
        # Fetch contacts from DB
        contacts_cursor = db.trusted_contacts.find({"user_id": current_user.sub})
        contacts_data = await contacts_cursor.to_list(length=100)
        contacts = [{"phone": c["contact_phone"]} for c in contacts_data] if contacts_data else []
        
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
    db = get_db()
    
    ping_data = {
        "_id": str(uuid.uuid4()),
        "user_id": current_user.sub,
        "sos_event_id": str(ping.sos_event_id),
        "lat": ping.lat,
        "lng": ping.lng,
        "accuracy": ping.accuracy,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.location_pings.insert_one(ping_data)
        
    return {"received": True}

async def resolve_sos(sos_id: str, resolution: SOSResolve):
    db = get_db()
    
    update_data = {
        "$set": {
            "resolved": True
        }
    }
    
    result = await db.sos_events.update_one({"id": sos_id}, update_data)
    
    if result.matched_count == 0:
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
    db = get_db()
    
    # Fetch user's incidents
    cursor = db.sos_events.find({"user_id": current_user.sub}).sort("created_at", -1)
    data = await cursor.to_list(length=100)
    
    return data

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

