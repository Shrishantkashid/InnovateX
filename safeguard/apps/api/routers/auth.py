from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from ..models.user import UserCreate, UserResponse, Token
from ..database import get_supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    supabase = get_supabase()
    
    # 1. Sign up with Supabase Auth
    # We pass role and module in user_metadata so they are available in the JWT
    try:
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name,
                    "role": user_data.role,
                    "module": user_data.module,
                    "phone": user_data.phone
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )
        
        user = auth_response.user
        
        # Note: Profiles table is usually populated by a database trigger 
        # (handle_new_user in schema.sql). 
        # If the trigger isn't set up yet, we could do it manually here.
        
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user_data.full_name,
            "phone": user_data.phone,
            "role": user_data.role,
            "module": user_data.module,
            "is_verified": False,
            "created_at": user.created_at
        }
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    supabase = get_supabase()
    
    try:
        # Sign in with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": form_data.username,
            "password": form_data.password
        })
        
        if not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        session = auth_response.session
        user = auth_response.user
        
        return {
            "access_token": session.access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.user_metadata.get("full_name"),
                "phone": user.user_metadata.get("phone"),
                "role": user.user_metadata.get("role"),
                "module": user.user_metadata.get("module"),
                "is_verified": user.user_metadata.get("is_verified", False),
                "created_at": user.created_at
            }
        }
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

@router.post("/logout")
async def logout():
    supabase = get_supabase()
    supabase.auth.sign_out()
    return {"message": "Successfully logged out"}
