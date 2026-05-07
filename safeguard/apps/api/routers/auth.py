from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from ..models.user import UserCreate, UserResponse, Token
from ..utils.auth import get_password_hash, verify_password, create_access_token
from ..database import get_supabase
from datetime import timedelta

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    supabase = get_supabase()
    
    # 1. Check if user already exists
    existing_user = supabase.table("users").select("*").eq("email", user.email).execute()
    if existing_user.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 2. Hash password and save to database
    # In a real setup, you might use Supabase Auth's signup method, 
    # but here we follow the PRD's schema-first approach.
    hashed_password = get_password_hash(user.password)
    
    user_data = {
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.role,
        "module": user.module,
        "password_hash": hashed_password # Note: Ensure your schema has this column
    }
    
    result = supabase.table("users").insert(user_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    return result.data[0]

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    supabase = get_supabase()
    
    # 1. Fetch user by email (sub)
    user_result = supabase.table("users").select("*").eq("email", form_data.username).execute()
    
    if not user_result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = user_result.data[0]
    
    # 2. Verify password
    if not verify_password(form_data.password, user.get("password_hash")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Create JWT
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
