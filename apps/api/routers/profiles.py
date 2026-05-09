from fastapi import APIRouter, Depends, HTTPException, status
from models.user import UserResponse, TokenData, ProfileUpdate
from utils.auth import get_current_user
from database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: TokenData = Depends(get_current_user)):
    """
    Retrieve the profile of the currently authenticated user.
    """
    db = get_db()
    
    try:
        user_profile = await db.profiles.find_one({"_id": current_user.sub})
        
        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
            
        return user_profile
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile"
        )

@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Update the profile of the currently authenticated user.
    """
    db = get_db()
    
    # Filter out None values
    update_dict = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update"
        )
        
    try:
        result = await db.profiles.update_one({"_id": current_user.sub}, {"$set": update_dict})
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found or update failed"
            )
            
        updated_profile = await db.profiles.find_one({"_id": current_user.sub})
        return updated_profile
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(
    user_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Retrieve any user's profile (Role-based access should be enforced via RLS in Supabase).
    """
    db = get_db()
    
    try:
        user_profile = await db.profiles.find_one({"_id": user_id})
        
        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
            
        return user_profile
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile"
        )
