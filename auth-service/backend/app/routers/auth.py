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
            date_created=user.date_created,
            is_premium=user.is_premium,
            role=user.role,
            show_premium_badge=user.show_premium_badge,
            default_phone=user.default_phone,
            default_other_contact=user.default_other_contact
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
            date_created=user.date_created,
            is_premium=user.is_premium,
            role=user.role,
            show_premium_badge=user.show_premium_badge,
            default_phone=user.default_phone,
            default_other_contact=user.default_other_contact
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
        date_created=current_user.date_created,
        is_premium=current_user.is_premium,
        role=current_user.role,
        show_premium_badge=current_user.show_premium_badge,
        default_phone=current_user.default_phone,
        default_other_contact=current_user.default_other_contact
    )


@router.post("/logout")
async def logout(current_user: UserInDB = Depends(get_current_user)):
    """Logout (client should remove token)"""
    # Since we're using stateless JWT, logout is handled client-side
    # In a production app, you might want to maintain a token blacklist
    return {"message": "Successfully logged out"}


@router.patch("/me/preferences", response_model=UserResponse)
async def update_user_preferences(
    preferences: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update user preferences like show_premium_badge"""
    from app.database import get_database
    from app.services.user_service import get_user_by_id
    from bson import ObjectId
    
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    
    users_collection = db.Users
    
    update_data = {}
    if "show_premium_badge" in preferences:
        update_data["show_premium_badge"] = bool(preferences["show_premium_badge"])
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid preferences provided"
        )
    
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    
    # Fetch updated user
    updated_user = await get_user_by_id(str(current_user.id))
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        username=updated_user.username,
        name=updated_user.name,
        date_created=updated_user.date_created,
        is_premium=updated_user.is_premium,
        role=updated_user.role,
        show_premium_badge=updated_user.show_premium_badge,
        default_phone=updated_user.default_phone,
        default_other_contact=updated_user.default_other_contact
    )


@router.get("/me/stats")
async def get_user_stats(current_user: UserInDB = Depends(get_current_user)):
    """Get user statistics (contributions count)"""
    from app.database import get_database
    from bson import ObjectId
    
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    
    user_id = str(current_user.id)
    
    # Count alerts created by user
    alerts_count = await db.alerts.count_documents({"user_id": user_id})
    
    # Count helpboard requests created by user
    requests_count = await db["Helpboard_Requests"].count_documents({"user_id": user_id})
    
    # Count helpboard responses created by user
    responses_count = await db["Helpboard_Responses"].count_documents({"responder_id": user_id})
    
    # Count reminders created by user
    reminders_count = await db["Reminders"].count_documents({"user_id": user_id})
    
    total_contributions = alerts_count + requests_count + responses_count + reminders_count
    
    return {
        "alerts": alerts_count,
        "requests": requests_count,
        "responses": responses_count,
        "reminders": reminders_count,
        "total": total_contributions
    }


@router.post("/me/premium/upgrade", response_model=UserResponse)
async def upgrade_to_premium(current_user: UserInDB = Depends(get_current_user)):
    """Upgrade user to premium"""
    from app.database import get_database
    from app.services.user_service import get_user_by_id
    from bson import ObjectId
    
    if current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already premium"
        )
    
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    
    users_collection = db.Users
    
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"is_premium": True}}
    )
    
    # Fetch updated user
    updated_user = await get_user_by_id(str(current_user.id))
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        username=updated_user.username,
        name=updated_user.name,
        date_created=updated_user.date_created,
        is_premium=updated_user.is_premium,
        role=updated_user.role,
        show_premium_badge=updated_user.show_premium_badge,
        default_phone=updated_user.default_phone,
        default_other_contact=updated_user.default_other_contact
    )


@router.post("/me/premium/cancel", response_model=UserResponse)
async def cancel_premium(current_user: UserInDB = Depends(get_current_user)):
    """Cancel premium subscription"""
    from app.database import get_database
    from app.services.user_service import get_user_by_id
    from bson import ObjectId
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not premium"
        )
    
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    
    users_collection = db.Users
    
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"is_premium": False}}
    )
    
    # Fetch updated user
    updated_user = await get_user_by_id(str(current_user.id))
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        username=updated_user.username,
        name=updated_user.name,
        date_created=updated_user.date_created,
        is_premium=updated_user.is_premium,
        role=updated_user.role,
        show_premium_badge=updated_user.show_premium_badge,
        default_phone=updated_user.default_phone,
        default_other_contact=updated_user.default_other_contact
    )


@router.patch("/me/profile", response_model=UserResponse)
async def update_user_profile(
    profile_data: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update user profile (username, default_phone, default_other_contact)"""
    from app.database import get_database
    from app.services.user_service import get_user_by_id
    from bson import ObjectId
    
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    
    users_collection = db.Users
    
    update_data = {}
    
    # Validate and update username
    if "username" in profile_data:
        new_username = profile_data["username"].strip()
        if not new_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username cannot be empty"
            )
        # Check if username is already taken by another user
        existing_user = await users_collection.find_one({
            "username": new_username,
            "_id": {"$ne": ObjectId(current_user.id)}
        })
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        update_data["username"] = new_username
    
    # Update default contact info
    if "default_phone" in profile_data:
        update_data["default_phone"] = profile_data["default_phone"].strip() if profile_data["default_phone"] else None
    
    if "default_other_contact" in profile_data:
        update_data["default_other_contact"] = profile_data["default_other_contact"].strip() if profile_data["default_other_contact"] else None
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid profile data provided"
        )
    
    await users_collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    
    # Fetch updated user
    updated_user = await get_user_by_id(str(current_user.id))
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        username=updated_user.username,
        name=updated_user.name,
        date_created=updated_user.date_created,
        is_premium=updated_user.is_premium,
        role=updated_user.role,
        show_premium_badge=updated_user.show_premium_badge,
        default_phone=updated_user.default_phone,
        default_other_contact=updated_user.default_other_contact
    )

