
from fastapi import APIRouter, HTTPException, Query, Depends
from bson import ObjectId
from datetime import datetime
from typing import Optional
from app.database import get_database
from app.models.helpboard_request import HelpboardRequest
from app.utils.serializers import convert_objectids
from app.middleware.auth import get_current_user
from app.models.user import UserInDB
from app.utils.permissions import can_edit_request, can_delete_request

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
async def update_request(
    request_id: str,
    update_data: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update a helpdesk request. Requires permission to edit."""
    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID format")

    db = get_database()
    
    # Get the request
    request = await db["Helpboard_Requests"].find_one({"_id": oid})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Check permissions
    request_user_id = request.get("user_id", "")
    if not can_edit_request(current_user, request_user_id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to edit this request"
        )
    
    # Prepare update data
    update_dict = {k: v for k, v in update_data.items() if k != "_id"}
    update_dict["date_updated"] = datetime.utcnow()
    
    res = await db["Helpboard_Requests"].update_one({"_id": oid}, {"$set": update_dict})

    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found or no changes made")

    updated = await db["Helpboard_Requests"].find_one({"_id": oid})
    return convert_objectids(updated)


@router.delete("/helpboard/requests/{request_id}")
async def delete_request(
    request_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete a helpdesk request. Requires permission to delete."""
    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID format")

    db = get_database()
    
    # Get the request
    request = await db["Helpboard_Requests"].find_one({"_id": oid})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Check permissions
    request_user_id = request.get("user_id", "")
    if not can_delete_request(current_user, request_user_id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to delete this request"
        )
    
    # Delete the request
    result = await db["Helpboard_Requests"].delete_one({"_id": oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"message": "Request deleted successfully"}


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
