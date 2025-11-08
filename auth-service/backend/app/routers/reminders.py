from fastapi import APIRouter, HTTPException, Depends
from app.models.reminder import ReminderCreate, ReminderResponse, ReminderCreateRequest
from app.services.reminder_service import create_reminder, get_user_reminders, delete_reminder
from app.middleware.auth import get_current_user_id
from typing import List

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.post("", response_model=ReminderResponse, status_code=201)
async def create_reminder_endpoint(
    request: ReminderCreateRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new reminder for the authenticated user"""
    try:
        reminder_data = ReminderCreate(text=request.text, user_id=user_id)
        created = await create_reminder(reminder_data)
        return ReminderResponse(
            id=str(created.id),
            text=created.text,
            user_id=created.user_id,
            created_at=created.created_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating reminder: {str(e)}"
        )


@router.get("", response_model=List[ReminderResponse])
async def get_reminders(user_id: str = Depends(get_current_user_id)):
    """Get all reminders for the authenticated user"""
    try:
        reminders = await get_user_reminders(user_id)
        return [
            ReminderResponse(
                id=str(r.id),
                text=r.text,
                user_id=r.user_id,
                created_at=r.created_at
            )
            for r in reminders
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching reminders: {str(e)}"
        )


@router.delete("/{reminder_id}")
async def delete_reminder_endpoint(
    reminder_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a reminder for the authenticated user"""
    try:
        deleted = await delete_reminder(reminder_id, user_id)
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Reminder not found"
            )
        return {"message": "Reminder deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting reminder: {str(e)}"
        )

