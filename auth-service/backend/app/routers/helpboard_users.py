from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional
from app.database import get_database
from app.utils.serializers import convert_objectids

router = APIRouter()


@router.get("/helpboard/users")
async def list_users(limit: int = 50):
    db = get_database()
    cursor = db["Helpboard_Users"].find().limit(limit)
    docs = await cursor.to_list(length=limit)
    return [convert_objectids(doc) for doc in docs]


@router.post("/helpboard/users")
async def create_user(user: dict):
    db = get_database()
    user["date_created"] = datetime.utcnow()
    user["date_updated"] = datetime.utcnow()
    result = await db["Helpboard_Users"].insert_one(user)
    inserted = await db["Helpboard_Users"].find_one({"_id": result.inserted_id})
    return convert_objectids(inserted)


@router.get("/helpboard/users/nearby")
async def get_nearby_users(lat: float, lon: float, radius_km: float = 3.0):
    db = get_database()
    users = await db["Helpboard_Users"].find({
        "location": {
            "$near": {
                "$geometry": { "type": "Point", "coordinates": [lon, lat] },
                "$maxDistance": radius_km * 1000
            }
        }
    }).to_list(length=50)
    return [convert_objectids(u) for u in users]
