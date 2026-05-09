from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timedelta
import hashlib
import hmac
import uuid
import secrets
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
PBKDF2_ITERATIONS = 260000

def verify_password(plain_password, hashed_password):
    if hashed_password.startswith("pbkdf2_sha256$"):
        try:
            _, iterations, salt, expected = hashed_password.split("$", 3)
            digest = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                int(iterations),
            ).hex()
            return hmac.compare_digest(digest, expected)
        except ValueError:
            return False

    try:
        import bcrypt

        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False

def get_password_hash(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest}"
import os
import requests
from config import settings
from models.schemas import (
    UserCreate, UserLogin, Token,
    AadhaarOTPRequest, AadhaarOTPResponse, AadhaarVerifyRequest
)
from auth_store import find_user_by_email, insert_user
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Sandbox configuration
SANDBOX_API_KEY = settings.SANDBOX_API_KEY
SANDBOX_API_SECRET = settings.SANDBOX_API_SECRET
SANDBOX_BASE_URL = settings.SANDBOX_BASE_URL.rstrip("/")
SANDBOX_TOKEN: dict[str, object] = {"value": None, "expires_at": datetime.min}
VERIFIED_AADHAAR_REFERENCES: dict[str, dict[str, object]] = {}

def live_sandbox_configured() -> bool:
    return bool(SANDBOX_API_KEY and SANDBOX_API_SECRET and SANDBOX_API_KEY.startswith("key_live"))

def require_sandbox_configured() -> None:
    if not live_sandbox_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sandbox Aadhaar credentials are not configured on the backend",
        )

def is_female_gender(gender: object) -> bool:
    if gender is None:
        return False
    return str(gender).strip().upper().startswith("F")

def get_sandbox_access_token() -> str:
    expires_at = SANDBOX_TOKEN["expires_at"]
    if isinstance(expires_at, datetime) and SANDBOX_TOKEN["value"] and expires_at > datetime.utcnow():
        return str(SANDBOX_TOKEN["value"])

    response = requests.post(
        f"{SANDBOX_BASE_URL}/authenticate",
        headers={
            "x-api-key": SANDBOX_API_KEY or "",
            "x-api-secret": SANDBOX_API_SECRET or "",
            "x-api-version": "1.0.0",
        },
        timeout=20,
    )
    data = response.json()
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=data.get("message", "Sandbox authentication failed"),
        )

    token = data.get("access_token") or data.get("data", {}).get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Sandbox authentication did not return an access token",
        )

    SANDBOX_TOKEN["value"] = token
    SANDBOX_TOKEN["expires_at"] = datetime.utcnow() + timedelta(hours=20)
    return str(token)

def sandbox_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {get_sandbox_access_token()}",
        "x-api-key": SANDBOX_API_KEY or "",
        "x-api-version": "1.0.0",
        "content-type": "application/json",
    }

@router.get("/aadhaar/status")
async def aadhaar_status():
    return {
        "sandbox_configured": live_sandbox_configured(),
        "base_url": SANDBOX_BASE_URL,
    }

@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate):
    print(f"--- SIGNUP ATTEMPT FOR: {user_data.email} ---")
    
    try:
        normalized_email = user_data.email.lower()
        existing_user = await find_user_by_email(normalized_email)
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        aadhaar_verification = None
        if user_data.role == "woman":
            if not user_data.aadhaarNumber or not user_data.aadhaarReferenceId:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Aadhaar verification is required for women signup",
                )

            aadhaar_verification = VERIFIED_AADHAAR_REFERENCES.get(user_data.aadhaarReferenceId)
            if not aadhaar_verification or not aadhaar_verification.get("is_female"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Signup allowed only after Aadhaar verifies the user as female",
                )

        user_id = str(uuid.uuid4())
        hashed_pwd = get_password_hash(user_data.password)
        unique_id = None
        if user_data.role in {"child", "parent"}:
            unique_id = f"{user_data.role.upper()}-{uuid.uuid4().hex[:6].upper()}"
        
        profile_payload = {
            "_id": user_id,
            "id": user_id, # Keep id field for frontend compatibility
            "email": normalized_email,
            "hashed_password": hashed_pwd,
            "full_name": user_data.name,
            "name": user_data.name,
            "role": user_data.role,
            "module": user_data.module,
            "phone": user_data.phone,
            "emergency_contact": user_data.emergencyContact,
            "unique_id": unique_id,
            "is_verified": True,
            "aadhaar_verified": user_data.role == "woman",
            "aadhaar_last4": user_data.aadhaarNumber[-4:] if user_data.aadhaarNumber else None,
            "aadhaar_reference_id": user_data.aadhaarReferenceId,
            "aadhaar_gender": aadhaar_verification.get("gender") if aadhaar_verification else None,
        }
        
        saved_profile = await insert_user(profile_payload)
        
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
                "email": normalized_email,
                "role": user_data.role,
                "full_name": user_data.name,
                "phone": user_data.phone,
                "unique_id": unique_id,
                "is_verified": saved_profile.get("is_verified", False),
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
    
    try:
        user = await find_user_by_email(credentials.email.lower())
        
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
                "phone": user.get("phone", ""),
                "unique_id": user.get("unique_id"),
                "is_verified": user.get("is_verified", False),
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
    payload = {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        "aadhaar_number": request.aadhaar_number,
        "consent": "Y",
        "reason": "For identity verification in SafeGuard application"
    }

    try:
        require_sandbox_configured()

        response = requests.post(url, json=payload, headers=sandbox_headers(), timeout=30)
        res_data = response.json()

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=res_data.get("message", "Aadhaar API Error"))

        return {
            "reference_id": res_data.get("data", {}).get("reference_id"),
            "message": "OTP sent successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/aadhaar/verify")
async def verify_aadhaar_otp(request: AadhaarVerifyRequest):
    url = f"{SANDBOX_BASE_URL}/kyc/aadhaar/okyc/otp/verify"
    payload = {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        "reference_id": request.reference_id,
        "otp": request.otp
    }

    try:
        require_sandbox_configured()

        response = requests.post(url, json=payload, headers=sandbox_headers(), timeout=30)
        res_data = response.json()

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=res_data.get("message", "Aadhaar Verification Error"))

        response_data = res_data.get("data", {})
        if response_data.get("status") != "VALID":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=response_data.get("message", "Aadhaar OTP verification failed"),
            )

        gender = response_data.get("gender")
        if not is_female_gender(gender):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Verification failed: Aadhaar must identify the user as female for this role.",
            )

        VERIFIED_AADHAAR_REFERENCES[request.reference_id] = {
            "gender": gender,
            "is_female": True,
            "verified_at": datetime.utcnow().isoformat(),
            "mode": "sandbox",
        }

        return {
            "success": True,
            "message": "Aadhaar verified successfully",
            "data": response_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
