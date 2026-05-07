from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..database import get_supabase
from ..models.user import TokenData
import logging

logger = logging.getLogger(__name__)

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Verifies the Supabase JWT token and returns the user data.
    """
    supabase = get_supabase()
    
    try:
        # Supabase auth.get_user(jwt) verifies the token and returns user details
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = user_response.user
        # Extract role from user metadata (Supabase stores this in raw_user_meta_data)
        role = user.user_metadata.get("role")
        email = user.email
        
        return TokenData(email=email, role=role, sub=str(user.id))
        
    except Exception as e:
        logger.error(f"Auth verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_role(allowed_roles: list):
    """
    Dependency to check if the current user has one of the allowed roles.
    """
    async def role_dependency(current_user: TokenData = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not authorized to access this resource"
            )
        return current_user
    return role_dependency
