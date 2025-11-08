# MongoDB Compass Import Instructions

## How to Import Test Data

### Step 1: Import Users
1. Open MongoDB Compass
2. Connect to your cluster: `cluster0.l4aer7e.mongodb.net`
3. Select the `KidSafe` database
4. Click on the `users` collection (or create it if it doesn't exist)
5. Click "Add Data" → "Import File"
6. Select `test_users.json`
7. Choose "JSON" format
8. Click "Import"

### Step 2: Import Alerts
1. In the same `KidSafe` database
2. Click on the `alerts` collection (or create it if it doesn't exist)
3. Click "Add Data" → "Import File"
4. Select `test_data.json`
5. Choose "JSON" format
6. Click "Import"

## Note
- The `user_id` fields in alerts are placeholders. After importing users, you'll need to update the alerts with the actual MongoDB `_id` values from the users collection.
- Or you can manually link them by matching usernames in your application code.

