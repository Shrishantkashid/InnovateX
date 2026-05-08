from fastapi import APIRouter, HTTPException, status, Depends
from database import get_db
import uuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)
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
    db = get_db()
    
    try:
        existing_user = await db.profiles.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
            
        user_id = str(uuid.uuid4())
        hashed_pwd = get_password_hash(user_data.password)
        
        profile_payload = {
            "_id": user_id,
            "id": user_id, # Keep id field for frontend compatibility
            "email": user_data.email,
            "hashed_password": hashed_pwd,
            "full_name": user_data.name,
            "role": user_data.role,
            "module": user_data.module,
            "phone": user_data.phone
        }
        
        await db.profiles.insert_one(profile_payload)
        
        from jose import jwt
        from datetime import datetime, timedelta
        from config import settings
        
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
        token = jwt.encode(
            {"sub": user_id, "email": user_data.email, "role": user_data.role, "exp": expire},
            settings.JWT_SECRET, 
            algorithm=settings.JWT_ALGORITHM
        )
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": user_data.email,
                "role": user_data.role,
                "full_name": user_data.name,
                "phone": user_data.phone
            }
        }
        
    except HTTPException:
        raise
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
    db = get_db()
    
    try:
        user = await db.profiles.find_one({"email": credentials.email})
        
        if not user or not verify_password(credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
            
        from jose import jwt
        from datetime import datetime, timedelta
        from config import settings
        
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
        token = jwt.encode(
            {"sub": user["_id"], "email": user["email"], "role": user["role"], "exp": expire},
            settings.JWT_SECRET, 
            algorithm=settings.JWT_ALGORITHM
        )
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["_id"],
                "email": user["email"],
                "role": user["role"],
                "full_name": user.get("full_name", ""),
                "phone": user.get("phone", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"LOGIN EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
