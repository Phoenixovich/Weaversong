from fastapi import APIRouter, Depends
from app.utils.auth import get_current_user

router = APIRouter()

@router.get("/me")
async def me(current_user = Depends(get_current_user)):
    """Return user info based on JWT from auth-service."""
    return current_user
