# Reuse database connection from auth-service
# This file can import from the main service or define its own connection
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os

class Database:
    client: Optional[AsyncIOMotorClient] = None

database = Database()

async def connect_to_mongo():
    """Create database connection"""
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    database.client = AsyncIOMotorClient(mongodb_uri)

async def close_mongo_connection():
    """Close database connection"""
    if database.client:
        database.client.close()

def get_database():
    """Get database instance"""
    if database.client is None:
        raise RuntimeError("Database client not initialized. Make sure the application has started.")
    mongodb_db = os.getenv("MONGODB_DB", "CommunityHelp")
    return database.client[mongodb_db]


