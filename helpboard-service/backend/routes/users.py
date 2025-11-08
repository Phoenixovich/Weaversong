# backend/routes/users.py
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from database import helpboard_users  # ✅ updated
from typing import Optional

router = APIRouter()

def serialize_user(user):
    if not user:
        return None
    user["_id"] = str(user["_id"])
    if "user_id" in user and isinstance(user["user_id"], ObjectId):
        user["user_id"] = str(user["user_id"])
    return user

@router.get("/")
async def list_users(limit: int = 50):
    cursor = helpboard_users.find().limit(limit)
    docs = await cursor.to_list(length=limit)
    return [serialize_user(doc) for doc in docs]

@router.post("/")
async def create_user(user: dict):
    user["date_created"] = datetime.utcnow()
    user["date_updated"] = datetime.utcnow()
    result = await helpboard_users.insert_one(user)
    inserted = await helpboard_users.find_one({"_id": result.inserted_id})
    return serialize_user(inserted)

@router.get("/nearby")
async def get_nearby_users(lat: float, lon: float, radius_km: float = 3.0):
    users = await helpboard_users.find({
        "location": {
            "$near": {
                "$geometry": { "type": "Point", "coordinates": [lon, lat] },
                "$maxDistance": radius_km * 1000
            }
        }
    }).to_list(length=50)
    return [serialize_user(u) for u in users]
