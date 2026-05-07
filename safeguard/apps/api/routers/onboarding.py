from fastapi import APIRouter, Depends, HTTPException, status
from ..models.user import TokenData, AadhaarOTPRequest, AadhaarVerifyRequest
from ..utils.auth import get_current_user, require_role
from ..services.aadhaar_service import aadhaar_service
from ..database import get_supabase
import random
import string
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

@router.post("/aadhaar/send-otp")
async def send_aadhaar_otp(
    payload: AadhaarOTPRequest,
    current_user: TokenData = Depends(require_role(["woman"]))
):
    """
    Send OTP to the mobile number registered with the provided Aadhaar number.
    Only available for users with the 'woman' role.
    """
    try:
        result = await aadhaar_service.send_otp(payload.aadhaar_number)
        
        # Sandbox usually returns a reference_id in the success response
        if "data" in result and "reference_id" in result["data"]:
            return {
                "message": "OTP sent successfully",
                "reference_id": result["data"]["reference_id"]
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to send OTP")
            )
    except Exception as e:
        logger.error(f"Error sending Aadhaar OTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/aadhaar/verify")
async def verify_aadhaar_otp(
    payload: AadhaarVerifyRequest,
    current_user: TokenData = Depends(require_role(["woman"]))
):
    """
    Verify Aadhaar OTP, extract gender, and approve if female.
    """
    supabase = get_supabase()
    
    try:
        result = await aadhaar_service.verify_otp(payload.otp, payload.reference_id)
        
        if "data" not in result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Verification failed")
            )
            
        user_details = result["data"]
        gender = user_details.get("gender", "").upper()
        
        # 1. Deny onboarding if not female
        if gender != "F" and "FEMALE" not in gender:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Identity verification failed: Only female users can onboard as 'Women'."
            )
        
        # 2. Update user profile as verified
        # We only store minimal metadata, NO Aadhaar number.
        verification_metadata = {
            "reference_id": payload.reference_id,
            "gender": gender,
            "verified_at": str(random.getrandbits(128)), # Placeholder for a proper timestamp or hash
            "full_name_verified": user_details.get("full_name")
        }
        
        update_result = supabase.table("profiles").update({
            "is_verified": True,
            "verification_metadata": verification_metadata
        }).eq("id", current_user.sub).execute()
        
        return {
            "message": "Aadhaar verification successful. Welcome to SafeGuard!",
            "user_details": {
                "full_name": user_details.get("full_name"),
                "gender": gender
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying Aadhaar OTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during verification"
        )

@router.post("/generate-id")
async def generate_role_id(
    current_user: TokenData = Depends(get_current_user)
):
    """
    Generates CHILD-XXXXXX or PARENT-XXXXXX IDs for respective roles.
    Bypasses Aadhaar verification.
    """
    if current_user.role not in ["child", "parent"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID generation only available for Child or Parent roles."
        )
    
    supabase = get_supabase()
    
    # Generate random suffix
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    role_id = f"{current_user.role.upper()}-{suffix}"
    
    try:
        # Update the respective profile table
        table_name = "child_profiles" if current_user.role == "child" else "parent_profiles"
        column_name = "child_id_tag" if current_user.role == "child" else "parent_id_tag"
        
        # Check if user already has a role profile, if not create one
        existing = supabase.table(table_name).select("*").eq("user_id", current_user.sub).execute()
        
        if existing.data:
            supabase.table(table_name).update({column_name: role_id}).eq("user_id", current_user.sub).execute()
        else:
            supabase.table(table_name).insert({
                "user_id": current_user.sub,
                column_name: role_id
            }).execute()
            
        return {
            "message": f"{current_user.role.capitalize()} ID generated successfully",
            "role_id": role_id
        }
    except Exception as e:
        logger.error(f"Error generating role ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate role ID"
        )
