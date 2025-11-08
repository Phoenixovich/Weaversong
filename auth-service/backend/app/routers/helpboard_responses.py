
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime
from app.database import get_database
from app.models.helpboard_response import HelpboardResponse
from app.utils.serializers import convert_objectids

router = APIRouter()


@router.get("/helpboard/responses")
async def list_responses(limit: int = 50):
    db = get_database()
    responses = await db["Helpboard_Responses"].find().limit(limit).to_list(length=limit)
    return [convert_objectids(r) for r in responses]


@router.post("/helpboard/responses")
async def create_response(response: HelpboardResponse):
    db = get_database()
    response_dict = response.model_dump()
    response_dict["date_created"] = datetime.utcnow()
    response_dict["date_updated"] = datetime.utcnow()
    response_dict["status"] = "pending"

    result = await db["Helpboard_Responses"].insert_one(response_dict)
    inserted = await db["Helpboard_Responses"].find_one({"_id": result.inserted_id})
    return convert_objectids(inserted)


@router.get("/helpboard/responses/{response_id}")
async def get_response(response_id: str):
    try:
        oid = ObjectId(response_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid response ID format")

    db = get_database()
    doc = await db["Helpboard_Responses"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Response not found")

    return convert_objectids(doc)


@router.put("/helpboard/responses/{response_id}/status")
async def update_response_status(response_id: str, status: str):
    """Accept or decline a response."""
    if status not in ["pending", "accepted", "declined"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    try:
        oid = ObjectId(response_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid response ID format")

    db = get_database()
    res = await db["Helpboard_Responses"].update_one(
        {"_id": oid}, {"$set": {"status": status, "date_updated": datetime.utcnow()}}
    )

    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Response not found")

    updated = await db["Helpboard_Responses"].find_one({"_id": oid})
    return convert_objectids(updated)
