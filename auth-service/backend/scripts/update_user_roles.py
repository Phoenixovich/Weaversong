"""
Script to update user roles in the database
- Sets all users to 'trusted_user' role
- Sets test@test.com to 'admin' role
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.models.user import UserRole


async def update_user_roles():
    """Update all users to trusted_user role, except test@test.com which gets admin"""
    print("=" * 60)
    print("User Role Update Script")
    print("=" * 60)
    print(f"Connecting to MongoDB: {settings.mongodb_db}")
    print(f"MongoDB URI: {settings.mongodb_uri[:50]}...")
    print("-" * 60)
    
    client = None
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(settings.mongodb_uri)
        db = client[settings.mongodb_db]
        users_collection = db.Users
        
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB successfully")
        
        # Count total users
        total_users = await users_collection.count_documents({})
        print(f"✓ Found {total_users} users in database")
        
        if total_users == 0:
            print("⚠ No users found in database. Exiting.")
            return
        
        print("-" * 60)
        print("Updating user roles...")
        
        # Update test@test.com to admin
        test_user_result = await users_collection.update_one(
            {"email": "test@test.com"},
            {"$set": {"role": UserRole.ADMIN.value}}
        )
        
        if test_user_result.matched_count > 0:
            print(f"✓ Updated test@test.com to {UserRole.ADMIN.value} role")
        else:
            print("⚠ test@test.com not found in database")
        
        # Update all other users to trusted_user (excluding test@test.com)
        trusted_user_result = await users_collection.update_many(
            {"email": {"$ne": "test@test.com"}},
            {"$set": {"role": UserRole.TRUSTED_USER.value}}
        )
        
        print(f"✓ Updated {trusted_user_result.modified_count} users to {UserRole.TRUSTED_USER.value} role")
        
        print("-" * 60)
        print("Verification:")
        
        # Verify updates
        admin_count = await users_collection.count_documents({"role": UserRole.ADMIN.value})
        trusted_count = await users_collection.count_documents({"role": UserRole.TRUSTED_USER.value})
        other_count = await users_collection.count_documents({
            "role": {"$nin": [UserRole.ADMIN.value, UserRole.TRUSTED_USER.value]}
        })
        
        print(f"  - Admin users: {admin_count}")
        print(f"  - Trusted users: {trusted_count}")
        print(f"  - Other roles: {other_count}")
        
        # Show test@test.com status
        test_user = await users_collection.find_one({"email": "test@test.com"})
        if test_user:
            print(f"  - test@test.com role: {test_user.get('role', 'not set')}")
        
        print("-" * 60)
        print("✓ Role update completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"✗ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if client:
            client.close()
            print("✓ Database connection closed")


if __name__ == "__main__":
    asyncio.run(update_user_roles())

