from fastapi import APIRouter, HTTPException, Depends
from models.module3 import BehaviourLog, ContactScore, DigestRequest, DigestResponse
from database import get_supabase
from utils.auth import get_current_user, require_role
from models.user import TokenData
from uuid import uuid4

router = APIRouter(prefix="/api", tags=["Module 3 - Digital Safety"])

@router.post("/digest", response_model=DigestResponse)
async def generate_weekly_digest(
    request: DigestRequest,
    current_user: TokenData = Depends(require_role(["parent"]))
):
    # This would trigger the GPT-4o-mini narrative generation logic
    return DigestResponse(
        digest_id=str(uuid4()),
        composite_risk=34.5,
        narrative="This week your child had 3 conversations with an unknown contact showing secrecy patterns.",
        conversation_starter="A natural way to bring this up is by asking about their new friends online...",
        pdf_url="https://supabase.co/storage/v1/object/public/digests/digest_123.pdf"
    )

@router.post("/contact-score")
async def receive_contact_score(
    score: ContactScore,
    current_user: TokenData = Depends(require_role(["child"]))
):
    supabase = get_supabase()
    
    score_data = {
        "child_id": current_user.sub,
        "contact_hash": score.contact_hash,
        "grooming_score": score.grooming_score,
        "top_flags": score.flags
    }
    
    result = supabase.table("contact_risk_scores").insert(score_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save contact score")
        
    return {"received": True, "alert_parent": score.grooming_score > 0.7}

@router.post("/behaviour")
async def receive_behaviour_logs(
    log: BehaviourLog,
    current_user: TokenData = Depends(require_role(["child"]))
):
    supabase = get_supabase()
    
    # Batch insert usage logs
    logs_data = []
    for entry in log.logs:
        logs_data.append({
            "child_id": current_user.sub,
            "app_name": entry.app,
            "session_start": entry.start.isoformat(),
            "session_end": entry.end.isoformat(),
            "duration_min": (entry.end - entry.start).total_seconds() / 60
        })
    
    if logs_data:
        result = supabase.table("app_usage_log").insert(logs_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save behaviour logs")
            
    return {"received": True, "anomaly_detected": False}
