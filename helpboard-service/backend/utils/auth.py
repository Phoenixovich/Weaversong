from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime
import os
from database import users
from bson import ObjectId

security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALG = os.getenv("JWT_ALG", "HS256")

def extract_claims(claims):
    """Extract matching fields for our schema."""
    return {
        "username": claims.get("preferred_username") or claims.get("username") or claims.get("sub"),
        "email": claims.get("email"),
        "name": claims.get("name"),
    }

async def upsert_user_from_token(claims):
    """Create or update the user in our Users collection."""
    data = extract_claims(claims)
    if not data["username"] or not data["email"]:
        raise HTTPException(status_code=400, detail="Invalid token claims")

    now = datetime.utcnow()
    existing = await users.find_one({"email": data["email"]})

    if existing:
        await users.update_one(
            {"_id": existing["_id"]},
            {"$set": {"username": data["username"], "name": data.get("name")}}
        )
        existing["username"] = data["username"]
        existing["name"] = data.get("name")
        return existing

    # Insert new
    user_doc = {
        "username": data["username"],
        "email": data["email"],
        "name": data.get("name"),
        "password_hash": None,  # handled by auth-service
        "date_created": now,
    }
    res = await users.insert_one(user_doc)
    new_user = await users.find_one({"_id": res.inserted_id})
    new_user["_id"] = str(new_user["_id"])
    return new_user

async def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT and return or create user."""
    try:
        payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    user = await upsert_user_from_token(payload)
    if not user:
        raise HTTPException(status_code=403, detail="User not found or invalid")

    # Normalize ObjectId for consistency
    if isinstance(user["_id"], ObjectId):
        user["_id"] = str(user["_id"])

    return user
