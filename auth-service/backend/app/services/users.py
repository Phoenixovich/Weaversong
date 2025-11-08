from bson import ObjectId
from datetime import datetime
from app.database import get_database

async def get_or_create_anonymous_user() -> str:
    """Get or create an anonymous user. Returns user_id."""
    try:
        db = get_database()
    except Exception:
        raise ValueError("Database not connected")
    
    # Look for existing anonymous user
    anonymous_user = await db.users.find_one({"username": "anonymous"})
    
    if anonymous_user:
        return str(anonymous_user["_id"])
    
    # Create new anonymous user
    user_doc = {
        "username": "anonymous",
        "email": None,
        "name": "Anonymous User",
        "password_hash": None,
        "date_created": datetime.now(),
        "is_anonymous": True
    }
    
    result = await db.users.insert_one(user_doc)
    return str(result.inserted_id)

async def get_or_create_user_by_username(username: str) -> str:
    """Get existing user by username or create new one. Returns user_id."""
    try:
        db = get_database()
    except Exception:
        raise ValueError("Database not connected")
    
    user = await db.users.find_one({"username": username})
    
    if user:
        return str(user["_id"])
    
    # Create new user
    user_doc = {
        "username": username,
        "email": None,
        "name": username,
        "password_hash": None,
        "date_created": datetime.now(),
        "is_anonymous": False
    }
    
    result = await db.users.insert_one(user_doc)
    return str(result.inserted_id)

async def get_user_by_id(user_id: str) -> dict | None:
    """Get user by ID. Returns user dict or None."""
    try:
        db = get_database()
    except Exception:
        raise ValueError("Database not connected")
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            return {
                "id": str(user["_id"]),
                "username": user.get("username"),
                "name": user.get("name"),
                "is_anonymous": user.get("is_anonymous", False)
            }
    except:
        pass
    return None
