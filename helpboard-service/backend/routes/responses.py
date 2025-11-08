from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime
from models.helpboard_response import HelpboardResponse
from database import helpboard_responses 

router = APIRouter()


def serialize_response(doc):
    """Convert ObjectIds to strings."""
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    if "request_id" in doc and isinstance(doc["request_id"], ObjectId):
        doc["request_id"] = str(doc["request_id"])
    if "responder_id" in doc and isinstance(doc["responder_id"], ObjectId):
        doc["responder_id"] = str(doc["responder_id"])
    return doc


@router.get("/")
async def list_responses(limit: int = 50):
    responses = await helpboard_responses.find().limit(limit).to_list(length=limit)
    return [serialize_response(r) for r in responses]


@router.post("/")
async def create_response(response: HelpboardResponse):
    response_dict = response.model_dump()
    response_dict["date_created"] = datetime.utcnow()
    response_dict["date_updated"] = datetime.utcnow()
    response_dict["status"] = "pending"

    result = await helpboard_responses.insert_one(response_dict)
    inserted = await helpboard_responses.find_one({"_id": result.inserted_id})
    return serialize_response(inserted)


@router.get("/{response_id}")
async def get_response(response_id: str):
    try:
        oid = ObjectId(response_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid response ID format")

    doc = await helpboard_responses.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Response not found")

    return serialize_response(doc)


@router.put("/{response_id}/status")
async def update_response_status(response_id: str, status: str):
    """Accept or decline a response."""
    if status not in ["pending", "accepted", "declined"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    try:
        oid = ObjectId(response_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid response ID format")

    res = await helpboard_responses.update_one(
        {"_id": oid}, {"$set": {"status": status, "date_updated": datetime.utcnow()}}
    )

    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Response not found")

    updated = await helpboard_responses.find_one({"_id": oid})
    return serialize_response(updated)
