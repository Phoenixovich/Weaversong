from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None

database = Database()

async def connect_to_mongo():
    """Create database connection"""
    database.client = AsyncIOMotorClient(settings.mongodb_uri)

async def close_mongo_connection():
    """Close database connection"""
    if database.client:
        database.client.close()

def get_database():
    """Get database instance"""
    if database.client is None:
        raise RuntimeError("Database client not initialized. Make sure the application has started.")
    return database.client[settings.mongodb_db]

