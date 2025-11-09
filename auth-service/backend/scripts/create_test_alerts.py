"""
Script to create test alerts with proper user_id for testing edit/delete functionality.
This script creates alerts for different users to test permission-based editing and deletion.
"""
import asyncio
import os
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB", "CommunityHelp")

async def get_user_id_by_email(db, email: str):
    """Get user ID by email"""
    user = await db.Users.find_one({"email": email})
    if user:
        return str(user["_id"])
    return None

async def create_test_alerts():
    """Create test alerts with proper user_id"""
    print("=" * 50)
    print("Creating Test Alerts")
    print("=" * 50)

    if not MONGODB_URI:
        print("Error: MONGODB_URI environment variable not set.")
        return

    client = None
    try:
        print(f"Connecting to MongoDB: {MONGODB_DB}")
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[MONGODB_DB]

        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB successfully")

        # Get user IDs
        test_user_id = await get_user_id_by_email(db, "test@test.com")
        if not test_user_id:
            print("Warning: test@test.com not found. Creating alerts without user_id.")
        else:
            print(f"✓ Found test user: {test_user_id}")

        # Test alerts data
        test_alerts = [
            {
                "title": "Road Closure on Calea Victoriei",
                "description": "Major road closure due to construction work. Use alternative routes.",
                "category": "Road",
                "priority": "High",
                "location": {
                    "lat": 44.4378,
                    "lng": 26.0967,
                    "address": "Calea Victoriei, Bucharest"
                },
                "location_hierarchy": {
                    "point": None,
                    "area": "Calea Victoriei",
                    "sector": "Sector 1",
                    "city": "Bucharest"
                },
                "neighborhood": "Calea Victoriei",
                "area_type": "Street",
                "timestamp": int(datetime.now().timestamp()),
                "user_id": test_user_id or "",
                "phone": "+40712345678",
                "email": "test@test.com",
                "other_contact": None
            },
            {
                "title": "Lost Dog in Herastrau Park",
                "description": "Golden retriever, friendly, last seen near the lake. Please contact if found.",
                "category": "Lost",
                "priority": "Medium",
                "location": {
                    "lat": 44.4700,
                    "lng": 26.0800,
                    "address": "Herastrau Park, Bucharest"
                },
                "location_hierarchy": {
                    "point": None,
                    "area": "Herastrau",
                    "sector": "Sector 1",
                    "city": "Bucharest"
                },
                "neighborhood": "Herastrau",
                "area_type": "Park",
                "timestamp": int(datetime.now().timestamp()),
                "user_id": test_user_id or "",
                "phone": "+40712345678",
                "email": "test@test.com",
                "other_contact": None
            },
            {
                "title": "Music Festival at AFI Cotroceni",
                "description": "Free outdoor music festival this weekend. Multiple artists performing.",
                "category": "Event",
                "priority": "Low",
                "location": {
                    "lat": 44.4300,
                    "lng": 26.0500,
                    "address": "AFI Cotroceni, Bucharest"
                },
                "location_hierarchy": {
                    "point": None,
                    "area": "AFI Cotroceni",
                    "sector": "Sector 4",
                    "city": "Bucharest"
                },
                "neighborhood": "Cotroceni",
                "area_type": "Shopping Center",
                "timestamp": int(datetime.now().timestamp()),
                "user_id": test_user_id or "",
                "phone": None,
                "email": None,
                "other_contact": None
            },
            {
                "title": "Water Leak on Bulevardul Magheru",
                "description": "Water pipe burst causing flooding. Avoid the area if possible.",
                "category": "Infrastructure",
                "priority": "Critical",
                "location": {
                    "lat": 44.4467,
                    "lng": 26.0967,
                    "address": "Bulevardul Magheru, Bucharest"
                },
                "location_hierarchy": {
                    "point": None,
                    "area": "Bulevardul Magheru",
                    "sector": "Sector 1",
                    "city": "Bucharest"
                },
                "neighborhood": "Bulevardul Magheru",
                "area_type": "Boulevard",
                "timestamp": int(datetime.now().timestamp()),
                "user_id": test_user_id or "",
                "phone": "+40712345678",
                "email": "test@test.com",
                "other_contact": None
            },
            {
                "title": "Traffic Jam at Piata Unirii",
                "description": "Heavy traffic due to event. Expect delays.",
                "category": "Traffic",
                "priority": "Medium",
                "location": {
                    "lat": 44.4278,
                    "lng": 26.1025,
                    "address": "Piata Unirii, Bucharest"
                },
                "location_hierarchy": {
                    "point": None,
                    "area": "Piata Unirii",
                    "sector": "Sector 3",
                    "city": "Bucharest"
                },
                "neighborhood": "Unirii",
                "area_type": "Square",
                "timestamp": int(datetime.now().timestamp()),
                "user_id": test_user_id or "",
                "phone": None,
                "email": None,
                "other_contact": None
            }
        ]

        # Insert test alerts
        print("\nCreating test alerts...")
        inserted_count = 0
        for alert_data in test_alerts:
            try:
                result = await db.alerts.insert_one(alert_data)
                inserted_count += 1
                print(f"✓ Created alert: {alert_data['title']} (ID: {result.inserted_id})")
            except Exception as e:
                print(f"✗ Failed to create alert '{alert_data['title']}': {e}")

        print(f"\n✓ Successfully created {inserted_count} test alerts")
        print("=" * 50)

        # Verify alerts
        total_alerts = await db.alerts.count_documents({})
        print(f"Total alerts in database: {total_alerts}")

    except Exception as e:
        print(f"Error creating test alerts: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if client:
            client.close()
            print("✓ Database connection closed")

if __name__ == "__main__":
    asyncio.run(create_test_alerts())


