import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables from a .env file (if present) and read needed vars
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")


async def test_connection():
    client = None
    try:
        if not MONGODB_URI:
            raise RuntimeError(
                "MONGODB_URI is not set. Please set it in the environment or in a .env file."
            )

        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DB_NAME]

        # Run a simple command to verify connection
        server_info = await db.command("ping")
        print("✅ Connected to MongoDB!")
        print("Server Info:", server_info)

        # Optional: list collections to verify DB access
        collections = await db.list_collection_names()
        print("Collections:", collections if collections else "No collections found yet.")

    except Exception as e:
        print("❌ Connection failed:", e)

    finally:
        if client:
            client.close()


if __name__ == "__main__":
    asyncio.run(test_connection())
