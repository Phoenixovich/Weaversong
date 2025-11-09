"""
Script to create test pedestrian data for popular Bucharest locations.
Uses realistic traffic patterns based on typical peak hours.
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import random

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB", "CommunityHelp")

# Popular Bucharest locations with realistic traffic patterns
POPULAR_LOCATIONS = [
    {
        "name": "Piata Unirii",
        "lat": 44.4278,
        "lng": 26.1025,
        "peak_hours": [8, 9, 10, 17, 18, 19, 20],  # Morning and evening rush
        "base_traffic": 50,
        "peak_multiplier": 3.0
    },
    {
        "name": "Herastrau Park",
        "lat": 44.4750,
        "lng": 26.0800,
        "peak_hours": [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],  # Daytime park visits
        "base_traffic": 30,
        "peak_multiplier": 2.5
    },
    {
        "name": "Calea Victoriei",
        "lat": 44.4475,
        "lng": 26.0975,
        "peak_hours": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],  # Shopping street
        "base_traffic": 40,
        "peak_multiplier": 2.8
    },
    {
        "name": "AFI Cotroceni",
        "lat": 44.4280,
        "lng": 26.0600,
        "peak_hours": [12, 13, 14, 15, 16, 17, 18, 19, 20, 21],  # Shopping mall hours
        "base_traffic": 35,
        "peak_multiplier": 3.5
    },
    {
        "name": "Gara de Nord",
        "lat": 44.4475,
        "lng": 26.0750,
        "peak_hours": [6, 7, 8, 9, 10, 17, 18, 19, 20, 21],  # Train station rush
        "base_traffic": 45,
        "peak_multiplier": 3.2
    },
    {
        "name": "Piata Victoriei",
        "lat": 44.4500,
        "lng": 26.0900,
        "peak_hours": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],  # Business district
        "base_traffic": 38,
        "peak_multiplier": 2.6
    },
    {
        "name": "Cismigiu Park",
        "lat": 44.4400,
        "lng": 26.0950,
        "peak_hours": [10, 11, 12, 13, 14, 15, 16, 17, 18],  # Park hours
        "base_traffic": 25,
        "peak_multiplier": 2.2
    },
    {
        "name": "Bulevardul Magheru",
        "lat": 44.4450,
        "lng": 26.1000,
        "peak_hours": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],  # Main boulevard
        "base_traffic": 42,
        "peak_multiplier": 2.7
    },
    {
        "name": "Lipscani",
        "lat": 44.4319,
        "lng": 26.1028,
        "peak_hours": [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],  # Nightlife area
        "base_traffic": 32,
        "peak_multiplier": 3.0
    },
    {
        "name": "Drumul Taberei",
        "lat": 44.4100,
        "lng": 26.0300,
        "peak_hours": [7, 8, 9, 17, 18, 19],  # Residential area rush
        "base_traffic": 28,
        "peak_multiplier": 2.3
    }
]


def generate_traffic_count(hour: int, location: dict) -> int:
    """Generate realistic traffic count for a given hour"""
    base = location["base_traffic"]
    
    if hour in location["peak_hours"]:
        multiplier = location["peak_multiplier"]
    else:
        multiplier = 0.3  # Low traffic outside peak hours
    
    # Add some randomness
    count = int(base * multiplier * random.uniform(0.8, 1.2))
    
    # Ensure minimum traffic during off-hours
    if count < 5:
        count = random.randint(5, 15)
    
    return count


async def create_test_pedestrian_data():
    """Create test pedestrian data for popular Bucharest locations"""
    print("=" * 50)
    print("Creating Test Pedestrian Data")
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

        # Generate data for the last 7 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)

        print(f"\nGenerating data from {start_date.date()} to {end_date.date()}")
        print(f"Total locations: {len(POPULAR_LOCATIONS)}")

        total_records = 0
        current_date = start_date

        while current_date <= end_date:
            print(f"\nProcessing date: {current_date.date()}")
            
            for location in POPULAR_LOCATIONS:
                # Generate data for each hour of the day
                for hour in range(24):
                    # Skip very low traffic hours (2-5 AM)
                    if 2 <= hour <= 5:
                        continue
                    
                    traffic_count = generate_traffic_count(hour, location)
                    
                    # Create multiple records for this hour (simulating multiple people)
                    for _ in range(traffic_count):
                        # Add some randomness to exact time within the hour
                        minute = random.randint(0, 59)
                        second = random.randint(0, 59)
                        
                        timestamp_dt = current_date.replace(
                            hour=hour,
                            minute=minute,
                            second=second
                        )
                        timestamp = int(timestamp_dt.timestamp())
                        
                        # Add small random offset to lat/lng to simulate movement
                        lat_offset = random.uniform(-0.0005, 0.0005)
                        lng_offset = random.uniform(-0.0005, 0.0005)
                        
                        doc = {
                            "lat": location["lat"] + lat_offset,
                            "lng": location["lng"] + lng_offset,
                            "timestamp": timestamp,
                            "hour": hour,
                            "day_of_week": timestamp_dt.weekday(),
                            "date": timestamp_dt.strftime("%Y-%m-%d"),
                            "created_at": datetime.utcnow()
                        }
                        
                        await db.pedestrian_data.insert_one(doc)
                        total_records += 1
            
            current_date += timedelta(days=1)

        print(f"\n✓ Successfully created {total_records} pedestrian data records")
        print("=" * 50)

        # Verify data
        total_count = await db.pedestrian_data.count_documents({})
        print(f"Total pedestrian records in database: {total_count}")

        # Show sample statistics
        print("\nSample statistics by location:")
        for location in POPULAR_LOCATIONS[:3]:  # Show first 3
            count = await db.pedestrian_data.count_documents({
                "lat": {"$gte": location["lat"] - 0.001, "$lte": location["lat"] + 0.001},
                "lng": {"$gte": location["lng"] - 0.001, "$lte": location["lng"] + 0.001}
            })
            print(f"  - {location['name']}: {count} records")

    except Exception as e:
        print(f"Error creating test pedestrian data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if client:
            client.close()
            print("✓ Database connection closed")


if __name__ == "__main__":
    asyncio.run(create_test_pedestrian_data())


