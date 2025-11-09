from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
from pydantic import Field, ConfigDict

class Settings(BaseSettings):
    mongodb_url: str = Field(
        default="",
        alias="MONGODB_URI"
    )
    mongodb_db_name: str = Field(
        default="CommunityHelp",
        alias="MONGODB_DB"
    )
    google_api_key: str | None = Field(
        default=None,
        alias="GOOGLE_API_KEY"
    )
    
    # Allow extra fields from .env file (like JWT_SECRET, CORS_ORIGIN, etc.)
    model_config = ConfigDict(
        env_file=".env",
        extra="allow",
        populate_by_name=True  # Allow both alias and field name
    )

settings = Settings()

client: AsyncIOMotorClient | None = None
database = None

async def connect_to_mongo():
    global client, database
    if not settings.mongodb_url:
        raise ValueError("MONGODB_URI environment variable is required. Please set it in your .env file.")
    try:
        client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
        # Test connection
        await client.admin.command('ping')
        database = client[settings.mongodb_db_name]
        print(f"Connected to MongoDB: {settings.mongodb_db_name}")
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        raise

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")

