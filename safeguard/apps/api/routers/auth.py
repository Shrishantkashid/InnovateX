from fastapi import APIRouter, HTTPException, status, Depends
from database import get_supabase
import os
import requests
from models.schemas import (
    UserCreate, UserLogin, Token, UserResponse, 
    AadhaarOTPRequest, AadhaarOTPResponse, AadhaarVerifyRequest
)
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Sandbox configuration
SANDBOX_API_KEY = os.getenv("SANDBOX_API_KEY")
SANDBOX_API_SECRET = os.getenv("SANDBOX_API_SECRET")
SANDBOX_BASE_URL = os.getenv("SANDBOX_BASE_URL", "https://api.sandbox.co.in")

@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate):
    print(f"--- SIGNUP ATTEMPT FOR: {user_data.email} ---")
    supabase = get_supabase()
    
    # 1. Sign up user via Supabase Auth
    try:
        print("Calling supabase.auth.sign_up...")
        # We pass metadata so it can be used by triggers or manual insert
        res = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.name,
                    "role": user_data.role,
                    "module": user_data.module
                }
            }
        })
        print(f"Supabase auth response received. Success: {bool(res.user)}")
        
        if not res.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup failed"
            )
            
        user = res.user
        
        # 2. Manually ensure profile exists (in case trigger is not set)
        profile_payload = {
            "id": user.id,
            "email": user_data.email,
            "full_name": user_data.name,
            "role": user_data.role,
            "module": user_data.module,
            "phone": user_data.phone
        }
        
        print(f"Upserting profile for user {user.id} into profiles table...")
        # We use upsert to be safe
        supabase.table("profiles").upsert(profile_payload).execute()
        print("Profile upserted successfully. Returning token.")
        
        return {
            "access_token": res.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user_data.email,
                "role": user_data.role,
                "full_name": user_data.name,
                "phone": user_data.phone
            }
        }
        
    except Exception as e:
        print(f"SIGNUP EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    print(f"--- LOGIN ATTEMPT FOR: {credentials.email} ---")
    supabase = get_supabase()
    
    try:
        print("Calling supabase.auth.sign_in_with_password...")
        res = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        print(f"Supabase auth response received. Success: {bool(res.session)}")
        
        if not res.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
            
        user = res.user
        
        print(f"Fetching profile for user {user.id} from profiles table...")
        # Fetch role and other data from profiles table
        profile = supabase.table("profiles").select("*").eq("id", user.id).execute()
        print(f"Profile fetched successfully.")
        role = profile.data[0].get("role", "woman") if profile.data else "woman"
        full_name = profile.data[0].get("full_name") if profile.data else ""
        
        return {
            "access_token": res.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": role,
                "full_name": full_name
            }
        }
        
    except Exception as e:
        print(f"LOGIN EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

# --- Aadhaar OKYC Endpoints ---

@router.post("/aadhaar/otp", response_model=AadhaarOTPResponse)
async def send_aadhaar_otp(request: AadhaarOTPRequest):
    url = f"{SANDBOX_BASE_URL}/kyc/aadhaar/okyc/otp"
    headers = {
        "x-api-key": SANDBOX_API_KEY,
        "x-api-secret": SANDBOX_API_SECRET,
        "x-api-version": "1.0",
        "content-type": "application/json"
    }
    payload = {
        "aadhaar_number": request.aadhaar_number,
        "consent": "y",
        "reason": "For identity verification in SafeGuard application"
    }

    try:
        if not SANDBOX_API_KEY or "key_live" not in SANDBOX_API_KEY:
            return {"reference_id": "demo_ref_123", "message": "OTP sent (DEMO MODE)"}

        response = requests.post(url, json=payload, headers=headers)
        res_data = response.json()

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=res_data.get("message", "Aadhaar API Error"))

        return {
            "reference_id": res_data.get("data", {}).get("reference_id"),
            "message": "OTP sent successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/aadhaar/verify")
async def verify_aadhaar_otp(request: AadhaarVerifyRequest):
    url = f"{SANDBOX_BASE_URL}/kyc/aadhaar/okyc/otp/verify"
    headers = {
        "x-api-key": SANDBOX_API_KEY,
        "x-api-secret": SANDBOX_API_SECRET,
        "x-api-version": "1.0",
        "content-type": "application/json"
    }
    payload = {
        "reference_id": request.reference_id,
        "otp": request.otp
    }

    try:
        if not SANDBOX_API_KEY or "key_live" not in SANDBOX_API_KEY:
            if request.otp == "123456":
                return {"success": True, "message": "Verified (DEMO MODE)", "data": {"gender": "F"}}
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP (DEMO MODE)")

        response = requests.post(url, json=payload, headers=headers)
        res_data = response.json()

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=res_data.get("message", "Aadhaar Verification Error"))

        gender = res_data.get("data", {}).get("gender")
        if gender and gender.upper() != "F":
             return {"success": False, "message": "Verification failed: User gender must be Female for this role.", "data": res_data.get("data")}

        return {
            "success": True,
            "message": "Aadhaar verified successfully",
            "data": res_data.get("data")
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
