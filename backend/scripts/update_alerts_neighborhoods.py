"""
Script to update existing alerts with neighborhood/area_type based on coordinates
Run with: python -m scripts.update_alerts_neighborhoods
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import connect_to_mongo, close_mongo_connection
import db
from services.geocoding import reverse_geocode
from services.neighborhoods import detect_neighborhood

async def update_alerts():
    """Update all alerts with neighborhood/area_type based on coordinates"""
    await connect_to_mongo()
    
    if db.database is None:
        print("Error: Database not connected")
        return
    
    print("Connected to MongoDB. Updating alerts...")
    
    # Get all alerts
    cursor = db.database.alerts.find({})
    alerts = []
    async for doc in cursor:
        alerts.append(doc)
    
    print(f"Found {len(alerts)} alerts to process")
    
    updated_count = 0
    skipped_count = 0
    
    for alert in alerts:
        alert_id = alert["_id"]
        
        # Skip if already has neighborhood
        if alert.get("neighborhood") and alert.get("area_type"):
            skipped_count += 1
            continue
        
        location = alert.get("location", {})
        lat = location.get("lat")
        lng = location.get("lng")
        address = location.get("address")
        
        # If no coordinates, skip
        if not lat or not lng:
            print(f"  Skipping alert {alert_id}: No coordinates")
            skipped_count += 1
            continue
        
        try:
            # Get address from coordinates if not available
            if not address:
                address = await reverse_geocode(lat, lng)
                if address:
                    # Update address in location
                    await db.database.alerts.update_one(
                        {"_id": alert_id},
                        {"$set": {"location.address": address}}
                    )
            
            # Detect neighborhood from address
            text = alert.get("title", "") + " " + alert.get("description", "")
            neighborhood, area_type = detect_neighborhood(text, address)
            
            if neighborhood and area_type:
                # Update alert with neighborhood
                await db.database.alerts.update_one(
                    {"_id": alert_id},
                    {"$set": {
                        "neighborhood": neighborhood,
                        "area_type": area_type
                    }}
                )
                print(f"  Updated alert {alert_id}: {neighborhood} ({area_type})")
                updated_count += 1
            else:
                print(f"  Could not detect neighborhood for alert {alert_id}")
                skipped_count += 1
                
        except Exception as e:
            print(f"  Error updating alert {alert_id}: {e}")
            skipped_count += 1
    
    print(f"\nSummary:")
    print(f"  Updated: {updated_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Total: {len(alerts)}")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(update_alerts())

