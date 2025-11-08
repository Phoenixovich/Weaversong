from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from models.helpboard_request import HelpboardRequest
from database import helpboard_requests
from typing import Optional

router = APIRouter()


def serialize_request(doc):
    """Convert MongoDB ObjectIds to strings."""
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    if "user_id" in doc and isinstance(doc["user_id"], ObjectId):
        doc["user_id"] = str(doc["user_id"])
    return doc


@router.get("/")
async def list_requests(limit: int = 50):
    cursor = helpboard_requests.find().limit(limit)
    docs = await cursor.to_list(length=limit)
    return [serialize_request(d) for d in docs]


@router.post("/")
async def create_request(request: HelpboardRequest):
    request_dict = request.model_dump()
    request_dict["date_created"] = datetime.utcnow()
    request_dict["date_updated"] = datetime.utcnow()

    result = await helpboard_requests.insert_one(request_dict)
    inserted = await helpboard_requests.find_one({"_id": result.inserted_id})
    return serialize_request(inserted)


@router.get("/{request_id}")
async def get_request(request_id: str):
    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID format")

    doc = await helpboard_requests.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")

    return serialize_request(doc)


@router.put("/{request_id}")
async def update_request(request_id: str, update_data: dict):
    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID format")

    update_data["date_updated"] = datetime.utcnow()
    res = await helpboard_requests.update_one({"_id": oid}, {"$set": update_data})

    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found or no changes made")

    updated = await helpboard_requests.find_one({"_id": oid})
    return serialize_request(updated)


@router.get("/search")
async def search_requests(
    trade: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    limit: int = Query(50)
):
    query = {}
    if trade:
        query["trade_needed"] = {"$regex": trade, "$options": "i"}
    if status:
        query["status"] = status
    if urgency:
        query["urgency"] = urgency

    cursor = helpboard_requests.find(query).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [serialize_request(d) for d in docs]
