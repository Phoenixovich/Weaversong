"""
Test script to verify MongoDB database connection
Run this before starting the server to ensure database connectivity
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


async def test_connection():
    """Test MongoDB connection"""
    print("Testing MongoDB connection...")
    print(f"MongoDB URI: {settings.mongodb_uri[:50]}...")  # Show first 50 chars
    print(f"Database: {settings.mongodb_db}")
    print("-" * 50)
    
    try:
        # Create connection
        client = AsyncIOMotorClient(settings.mongodb_uri)
        
        # Test connection by pinging the server
        print("Attempting to connect...")
        await client.admin.command('ping')
        print("✓ Connection successful!")
        
        # Get database
        db = client[settings.mongodb_db]
        print(f"✓ Database '{settings.mongodb_db}' accessible")
        
        # Check if Users collection exists or can be accessed
        collections = await db.list_collection_names()
        print(f"✓ Collections in database: {collections}")
        
        # Test Users collection
        users_collection = db.Users
        user_count = await users_collection.count_documents({})
        print(f"✓ Users collection accessible (contains {user_count} users)")
        
        # Close connection
        client.close()
        print("-" * 50)
        print("✓ All tests passed! Database connection is working.")
        return True
        
    except Exception as e:
        print(f"✗ Connection failed!")
        print(f"Error: {str(e)}")
        print("-" * 50)
        print("Troubleshooting:")
        print("1. Check your MONGODB_URI in .env file")
        print("2. Verify MongoDB Atlas network access (IP whitelist)")
        print("3. Check your MongoDB credentials")
        print("4. Ensure database name is correct")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_connection())
    sys.exit(0 if success else 1)

