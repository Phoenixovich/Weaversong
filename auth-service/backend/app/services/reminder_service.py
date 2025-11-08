from app.database import get_database
from app.models.reminder import ReminderCreate, ReminderInDB
from datetime import datetime
from bson import ObjectId
from typing import List, Optional


async def create_reminder(reminder_data: ReminderCreate) -> ReminderInDB:
    """Create a new reminder"""
    db = get_database()
    reminders_collection = db.Reminders
    
    reminder_dict = {
        "text": reminder_data.text,
        "user_id": reminder_data.user_id,
        "created_at": datetime.utcnow()
    }
    
    result = await reminders_collection.insert_one(reminder_dict)
    
    return ReminderInDB(
        id=result.inserted_id,
        text=reminder_dict["text"],
        user_id=reminder_dict["user_id"],
        created_at=reminder_dict["created_at"]
    )


async def get_user_reminders(user_id: str) -> List[ReminderInDB]:
    """Get all reminders for a user"""
    db = get_database()
    reminders_collection = db.Reminders
    
    cursor = reminders_collection.find({"user_id": user_id}).sort("created_at", -1)
    reminders = []
    
    async for reminder in cursor:
        reminders.append(ReminderInDB(
            id=reminder["_id"],
            text=reminder["text"],
            user_id=reminder["user_id"],
            created_at=reminder["created_at"]
        ))
    
    return reminders


async def delete_reminder(reminder_id: str, user_id: str) -> bool:
    """Delete a reminder"""
    db = get_database()
    reminders_collection = db.Reminders
    
    if not ObjectId.is_valid(reminder_id):
        return False
    
    result = await reminders_collection.delete_one({
        "_id": ObjectId(reminder_id),
        "user_id": user_id
    })
    
    return result.deleted_count > 0

