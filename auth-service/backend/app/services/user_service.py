from app.database import get_database
from app.models.user import UserCreate, UserInDB, UserRole
from app.utils.password import hash_password, verify_password
from datetime import datetime
from bson import ObjectId
from typing import Optional


async def create_user(user_data: UserCreate) -> UserInDB:
    """Create a new user in the database"""
    try:
        db = get_database()
        if db is None:
            raise ValueError("Database connection not available. Please check your MongoDB connection.")
        
        users_collection = db.Users  # Use "Users" collection (capitalized)
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise ValueError("User with this email already exists")
        
        existing_username = await users_collection.find_one({"username": user_data.username})
        if existing_username:
            raise ValueError("User with this username already exists")
        
        # Hash password and create user
        try:
            password_hash = hash_password(user_data.password)
        except Exception as e:
            raise ValueError(f"Failed to hash password: {str(e)}")
        
        user_dict = {
            "email": user_data.email,
            "username": user_data.username,
            "name": user_data.name,
            "password_hash": password_hash,
            "date_created": datetime.utcnow(),
            "is_premium": user_data.is_premium if hasattr(user_data, 'is_premium') else False,
            "role": user_data.role.value if hasattr(user_data, 'role') else UserRole.USER.value,
            "show_premium_badge": user_data.show_premium_badge if hasattr(user_data, 'show_premium_badge') else True,
            "default_phone": user_data.default_phone if hasattr(user_data, 'default_phone') else None,
            "default_other_contact": user_data.default_other_contact if hasattr(user_data, 'default_other_contact') else None
        }
        
        result = await users_collection.insert_one(user_dict)
        
        return UserInDB(
            id=result.inserted_id,
            email=user_dict["email"],
            username=user_dict["username"],
            name=user_dict["name"],
            password_hash=user_dict["password_hash"],
            date_created=user_dict["date_created"],
            is_premium=user_dict.get("is_premium", False),
            role=UserRole(user_dict.get("role", UserRole.USER.value)),
            show_premium_badge=user_dict.get("show_premium_badge", True),
            default_phone=user_dict.get("default_phone"),
            default_other_contact=user_dict.get("default_other_contact")
        )
    except ValueError:
        # Re-raise ValueError as-is
        raise
    except Exception as e:
        # Wrap other exceptions
        raise ValueError(f"Failed to create user: {str(e)}")


async def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Get a user by email"""
    db = get_database()
    users_collection = db.Users  # Use "Users" collection (capitalized)
    user = await users_collection.find_one({"email": email})
    
    if user:
        return UserInDB(
            id=user["_id"],
            email=user["email"],
            username=user["username"],
            name=user.get("name", ""),
            password_hash=user["password_hash"],
            date_created=user["date_created"],
            is_premium=user.get("is_premium", False),
            role=UserRole(user.get("role", UserRole.USER.value)),
            show_premium_badge=user.get("show_premium_badge", True),
            default_phone=user.get("default_phone"),
            default_other_contact=user.get("default_other_contact")
        )
    return None


async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    """Get a user by ID"""
    db = get_database()
    users_collection = db.Users  # Use "Users" collection (capitalized)
    
    if not ObjectId.is_valid(user_id):
        return None
    
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    if user:
        return UserInDB(
            id=user["_id"],
            email=user["email"],
            username=user["username"],
            name=user.get("name", ""),
            password_hash=user["password_hash"],
            date_created=user["date_created"],
            is_premium=user.get("is_premium", False),
            role=UserRole(user.get("role", UserRole.USER.value)),
            show_premium_badge=user.get("show_premium_badge", True),
            default_phone=user.get("default_phone"),
            default_other_contact=user.get("default_other_contact")
        )
    return None


async def verify_user_credentials(email: str, password: str) -> Optional[UserInDB]:
    """Verify user credentials and return user if valid"""
    user = await get_user_by_email(email)
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user

