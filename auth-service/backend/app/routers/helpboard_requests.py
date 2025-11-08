
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional
from app.database import get_database
from app.models.helpboard_request import HelpboardRequest
from app.utils.serializers import convert_objectids

router = APIRouter()


@router.get("/helpboard/requests")
async def list_requests(limit: int = 50):
    db = get_database()
    cursor = db["Helpboard_Requests"].find().limit(limit)
    docs = await cursor.to_list(length=limit)
    return [convert_objectids(d) for d in docs]


@router.post("/helpboard/requests")
async def create_request(request: HelpboardRequest):
    db = get_database()
    request_dict = request.model_dump()
    request_dict["date_created"] = datetime.utcnow()
    request_dict["date_updated"] = datetime.utcnow()

    result = await db["Helpboard_Requests"].insert_one(request_dict)
    inserted = await db["Helpboard_Requests"].find_one({"_id": result.inserted_id})
    return convert_objectids(inserted)


@router.get("/helpboard/requests/{request_id}")
async def get_request(request_id: str):
    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID format")

    db = get_database()
    doc = await db["Helpboard_Requests"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")

    return convert_objectids(doc)


@router.put("/helpboard/requests/{request_id}")
async def update_request(request_id: str, update_data: dict):
    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID format")

    update_data["date_updated"] = datetime.utcnow()
    db = get_database()
    res = await db["Helpboard_Requests"].update_one({"_id": oid}, {"$set": update_data})

    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found or no changes made")

    updated = await db["Helpboard_Requests"].find_one({"_id": oid})
    return convert_objectids(updated)


@router.get("/helpboard/requests/search")
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

    db = get_database()
    cursor = db["Helpboard_Requests"].find(query).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [convert_objectids(d) for d in docs]
