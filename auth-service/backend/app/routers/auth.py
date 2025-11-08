from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserCreate, UserLogin, UserResponse
from app.services.user_service import create_user, verify_user_credentials
from app.utils.jwt import create_access_token
from app.middleware.auth import get_current_user
from app.models.user import UserInDB
from datetime import timedelta
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await create_user(user_data)
        return UserResponse(
            id=str(user.id),
            email=user.email,
            username=user.username,
            name=user.name,
            date_created=user.date_created
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Catch any other exceptions and provide detailed error
        import traceback
        error_detail = str(e)
        print(f"Signup error: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during signup: {error_detail}"
        )


@router.post("/login")
async def login(credentials: UserLogin):
    """Login and get access token"""
    user = await verify_user_credentials(credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.jwt_expires_min)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=str(user.id),
            email=user.email,
            username=user.username,
            name=user.name,
            date_created=user.date_created
        )
    }


@router.post("/refresh")
async def refresh_token(current_user: UserInDB = Depends(get_current_user)):
    """Refresh the access token"""
    access_token_expires = timedelta(minutes=settings.jwt_expires_min)
    access_token = create_access_token(
        data={"sub": str(current_user.id), "email": current_user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        name=current_user.name,
        date_created=current_user.date_created
    )


@router.post("/logout")
async def logout(current_user: UserInDB = Depends(get_current_user)):
    """Logout (client should remove token)"""
    # Since we're using stateless JWT, logout is handled client-side
    # In a production app, you might want to maintain a token blacklist
    return {"message": "Successfully logged out"}

