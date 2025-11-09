from fastapi import APIRouter, HTTPException, Query, Depends, status
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from app.database import get_database
from app.utils.serializers import convert_objectids
from app.middleware.auth import get_current_user_id

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


# --- Helpboard user profile (user-scoped) ---
@router.get("/helpboard/users/me")
async def get_my_profile(user_id: str = Depends(get_current_user_id)):
    """Return the helpboard profile document for the currently authenticated user.
    If no profile exists yet return an empty structure with trades: [] so the frontend
    can render the editor.
    """
    db = get_database()
    doc = await db["Helpboard_Users"].find_one({"user_id": ObjectId(user_id)})
    if not doc:
        # return minimal structure expected by frontend
        return {"user_id": user_id, "trades": [], "availability": None}
    return convert_objectids(doc)


@router.put("/helpboard/users/me")
async def upsert_my_profile(profile: dict, user_id: str = Depends(get_current_user_id)):
    """Create or update the helpboard profile for the current user.
    Accepts partial profile fields (location, radius_km, trades, availability).
    """
    db = get_database()
    now = datetime.utcnow()

    # Build set fields only from allowed keys
    allowed = {"location", "radius_km", "trades", "availability"}
    set_fields = {k: v for k, v in profile.items() if k in allowed}
    set_fields["date_updated"] = now

    update = {
        "$set": set_fields,
        "$setOnInsert": {"date_created": now, "user_id": ObjectId(user_id)}
    }

    await db["Helpboard_Users"].update_one({"user_id": ObjectId(user_id)}, update, upsert=True)
    updated = await db["Helpboard_Users"].find_one({"user_id": ObjectId(user_id)})
    return convert_objectids(updated)


# --- Trades CRUD for the current user's profile ---
@router.post("/helpboard/users/me/trades", status_code=status.HTTP_201_CREATED)
async def add_trade(trade: dict, user_id: str = Depends(get_current_user_id)):
    """Add a new trade to the authenticated user's profile.
    If the profile doesn't exist it will be created.
    If a trade with the same name exists, return 400.
    """
    db = get_database()
    # ensure profile exists
    profile = await db["Helpboard_Users"].find_one({"user_id": ObjectId(user_id)})
    if not profile:
        now = datetime.utcnow()
        profile_doc = {
            "user_id": ObjectId(user_id),
            "trades": [trade],
            "date_created": now,
            "date_updated": now
        }
        await db["Helpboard_Users"].insert_one(profile_doc)
        return convert_objectids(profile_doc)

    # check duplicate by name
    trades: List[dict] = profile.get("trades", [])
    if any(t.get("name") == trade.get("name") for t in trades):
        raise HTTPException(status_code=400, detail="Trade with that name already exists")

    await db["Helpboard_Users"].update_one(
        {"user_id": ObjectId(user_id)},
        {"$push": {"trades": trade}, "$set": {"date_updated": datetime.utcnow()}}
    )
    updated = await db["Helpboard_Users"].find_one({"user_id": ObjectId(user_id)})
    return convert_objectids(updated)


@router.put("/helpboard/users/me/trades/{trade_name}")
async def update_trade(trade_name: str, trade: dict, user_id: str = Depends(get_current_user_id)):
    """Update an existing trade by name for the current user."""
    db = get_database()
    # Use arrayFilters to update the matching trade element
    res = await db["Helpboard_Users"].update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": {"trades.$[t]": trade, "date_updated": datetime.utcnow()}},
        array_filters=[{"t.name": trade_name}]
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    if res.modified_count == 0:
        # no trade updated -> not found
        raise HTTPException(status_code=404, detail="Trade not found")
    updated = await db["Helpboard_Users"].find_one({"user_id": ObjectId(user_id)})
    return convert_objectids(updated)


@router.delete("/helpboard/users/me/trades/{trade_name}")
async def delete_trade(trade_name: str, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    res = await db["Helpboard_Users"].update_one(
        {"user_id": ObjectId(user_id)},
        {"$pull": {"trades": {"name": trade_name}}, "$set": {"date_updated": datetime.utcnow()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    updated = await db["Helpboard_Users"].find_one({"user_id": ObjectId(user_id)})
    return convert_objectids(updated)