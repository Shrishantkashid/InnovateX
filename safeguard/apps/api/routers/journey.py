from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from datetime import datetime
from bson import ObjectId
from typing import Dict, List
from pydantic import BaseModel

# Import your Mongo client from database.py
from database import get_db

router = APIRouter(
    prefix="/api/journey",
    tags=["Journey"]
)

# -----------------------------
# REQUEST MODELS
# -----------------------------
class StartJourneyRequest(BaseModel):
    user_id: str
    destination_name: str
    destination_lat: float
    destination_lng: float
    expected_arrival_time: datetime
    shared_with: List[str] = []

class ConfirmArrivalRequest(BaseModel):
    user_id: str

# -----------------------------
# ACTIVE WEBSOCKET CONNECTIONS
# -----------------------------
active_connections: Dict[str, WebSocket] = {}

# =========================================================
# 1. START JOURNEY
# =========================================================
@router.post("/start")
async def start_journey(payload: StartJourneyRequest):
    """
    Creates a new journey document in MongoDB.
    """
    db = get_db()
    try:
        # Create journey object
        journey_data = {
            "user_id": payload.user_id,
            "destination_name": payload.destination_name,
            "destination_lat": payload.destination_lat,
            "destination_lng": payload.destination_lng,
            "expected_arrival_time": payload.expected_arrival_time,
            "status": "in_progress",
            "shared_with": payload.shared_with,
            "location_trail": [],
            "created_at": datetime.utcnow()
        }
        # Insert into MongoDB
        result = await db.journeys.insert_one(journey_data)
        # Convert ObjectId to string
        journey_id = str(result.inserted_id)
        return {
            "success": True,
            "message": "Journey started successfully",
            "journey_id": journey_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# 2. LIVE LOCATION STREAMING
# =========================================================
@router.websocket("/ws/location/{journey_id}")
async def websocket_location(
    websocket: WebSocket,
    journey_id: str
):
    """
    Receives live GPS coordinates from mobile app.
    """
    db = get_db()
    await websocket.accept()
    active_connections[journey_id] = websocket
    print(f"WebSocket connected for journey: {journey_id}")
    try:
        while True:
            # Receive JSON data from mobile
            data = await websocket.receive_json()
            # Example:
            # {
            #   "latitude": 12.91,
            #   "longitude": 77.59,
            #   "speed": 10
            # }
            location_data = {
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude"),
                "speed": data.get("speed", 0),
                "timestamp": datetime.utcnow()
            }
            # Save location inside MongoDB
            await db.journeys.update_one(
                {
                    "_id": ObjectId(journey_id)
                },
                {
                    "$push": {
                        "location_trail": location_data
                    }
                }
            )
            # Send response back to mobile
            await websocket.send_json({
                "success": True,
                "message": "Location received"
            })
            print("Location updated:", location_data)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
        active_connections.pop(journey_id, None)
    except Exception as e:
        print("WebSocket Error:", str(e))
        active_connections.pop(journey_id, None)

# =========================================================
# 3. CONFIRM ARRIVAL
# =========================================================
@router.post("/confirm-arrival/{journey_id}")
async def confirm_arrival(
    journey_id: str,
    payload: ConfirmArrivalRequest
):
    """
    Marks journey as completed.
    """
    db = get_db()
    try:
        journey = await db.journeys.find_one({
            "_id": ObjectId(journey_id)
        })
        if not journey:
            raise HTTPException(
                status_code=404,
                detail="Journey not found"
            )
        # Update status
        await db.journeys.update_one(
            {
                "_id": ObjectId(journey_id)
            },
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow()
                }
            }
        )
        return {
            "success": True,
            "message": "Arrival confirmed safely"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# 4. GET JOURNEY STATUS
# =========================================================
@router.get("/status/{journey_id}")
async def get_journey_status(journey_id: str):
    """
    Returns current journey details.
    """
    db = get_db()
    try:
        journey = await db.journeys.find_one({
            "_id": ObjectId(journey_id)
        })
        if not journey:
            raise HTTPException(
                status_code=404,
                detail="Journey not found"
            )
        # Convert ObjectId to string
        journey["_id"] = str(journey["_id"])
        return {
            "success": True,
            "journey": journey
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
