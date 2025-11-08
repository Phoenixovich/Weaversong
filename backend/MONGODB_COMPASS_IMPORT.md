# MongoDB Compass Import Instructions

## Import Alerts into MongoDB Compass

### Step 1: Connect to MongoDB
1. Open **MongoDB Compass**
2. Connect to your cluster using the connection string:
   ```
   mongodb+srv://sofiia:B1y7FkvDPG0USAhH@cluster0.l4aer7e.mongodb.net/?retryWrites=true&w=majority
   ```
3. Select the database: **`CommunityHelp`**

### Step 2: Import Alerts
1. In the **`CommunityHelp`** database, click on the **`alerts`** collection
   - If the collection doesn't exist, it will be created automatically
2. Click **"Add Data"** → **"Import File"**
3. Select the file: **`alerts_import.json`** (or `test_data.json`)
4. Choose **"JSON"** format
5. Click **"Import"**

### Step 3: Verify Import
1. After import, you should see 15 alert documents in the `alerts` collection
2. Click on any document to view its structure
3. Verify that all fields are present:
   - `title`, `description`, `category`, `priority`
   - `location` (with `lat`, `lng`, `address`)
   - `location_hierarchy` (with `point`, `area`, `sector`, `city`)
   - `neighborhood`, `area_type`
   - `timestamp`, `user_id`
   - `phone`, `email`, `other_contact` (optional)

## File Format

The import file (`alerts_import.json`) contains:
- **15 test alerts** covering various categories
- All required MongoDB schema fields
- Properly formatted JSON array
- Null values for optional fields (MongoDB Compass handles these correctly)

## Categories Included

- Road (Traffic Accident)
- Lost (Lost Dog, Found Cat, Lost Wallet)
- Weather (Heavy Rain Warning)
- Safety (Suspicious Activity, Ice on Sidewalks)
- Event (Community Cleanup)
- Construction (Road Closure)
- Infrastructure (Power Outage)
- PublicTransport (Metro Delay)
- Emergency (Fire Emergency)
- Environment (Air Quality Alert)
- Traffic (Traffic Jam)
- Crime (Theft Reported)

## Notes

- The `user_id` fields are placeholders (e.g., "user_johndoe", "user_anonymous")
- After importing, you may want to link these to actual user documents in the `users` collection
- Timestamps are Unix timestamps (seconds since epoch)
- Location coordinates are for Bucharest, Romania
- Some alerts have contact information (phone, email, WhatsApp) for testing

## Alternative: Using mongoimport (Command Line)

If you prefer using the command line:

```bash
mongoimport --uri "mongodb+srv://sofiia:B1y7FkvDPG0USAhH@cluster0.l4aer7e.mongodb.net/CommunityHelp?retryWrites=true&w=majority" \
  --collection alerts \
  --file alerts_import.json \
  --jsonArray
```

