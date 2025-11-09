
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from app.database import get_database
from app.models.helpboard_response import HelpboardResponse
from app.utils.serializers import convert_objectids
from app.middleware.auth import get_current_user
from app.models.user import UserInDB
from app.utils.permissions import can_edit_response, can_delete_response

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
async def update_response_status(
    response_id: str,
    status: str,
    current_user: UserInDB = Depends(get_current_user)
):
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


@router.patch("/helpboard/responses/{response_id}")
async def update_response(
    response_id: str,
    update_data: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update a helpdesk response. Requires permission to edit."""
    try:
        oid = ObjectId(response_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid response ID format")

    db = get_database()
    
    # Get the response
    response = await db["Helpboard_Responses"].find_one({"_id": oid})
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    
    # Check permissions
    response_user_id = response.get("responder_id", "")
    if not can_edit_response(current_user, response_user_id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to edit this response"
        )
    
    # Prepare update data
    update_dict = {k: v for k, v in update_data.items() if k != "_id" and k != "responder_id"}
    update_dict["date_updated"] = datetime.utcnow()
    
    res = await db["Helpboard_Responses"].update_one({"_id": oid}, {"$set": update_dict})

    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Response not found or no changes made")

    updated = await db["Helpboard_Responses"].find_one({"_id": oid})
    return convert_objectids(updated)


@router.delete("/helpboard/responses/{response_id}")
async def delete_response(
    response_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete a helpdesk response. Requires permission to delete."""
    try:
        oid = ObjectId(response_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid response ID format")

    db = get_database()
    
    # Get the response
    response = await db["Helpboard_Responses"].find_one({"_id": oid})
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    
    # Check permissions
    response_user_id = response.get("responder_id", "")
    if not can_delete_response(current_user, response_user_id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to delete this response"
        )
    
    # Delete the response
    result = await db["Helpboard_Responses"].delete_one({"_id": oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Response not found")
    
    return {"message": "Response deleted successfully"}
