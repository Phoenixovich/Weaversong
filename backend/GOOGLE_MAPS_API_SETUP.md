# Google Maps Platform API Setup Guide

This guide explains how to get and configure your Google Maps Platform API key for reverse geocoding and sector extraction.

## Step 1: Get Your Google Maps API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**:
   - Click on the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "Weaversong" or "LocalVoice")

3. **Enable Geocoding API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Geocoding API"
   - Click on it and click "Enable"

4. **Create API Key**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

5. **Restrict API Key (Recommended for Security)**:
   - Click on the API key you just created
   - Under "API restrictions", select "Restrict key"
   - Choose "Geocoding API" from the list
   - Under "Application restrictions", you can optionally restrict by IP or HTTP referrer
   - Click "Save"

## Step 2: Add API Key to Your Project

1. **Create `.env` file** in the `backend` directory (if it doesn't exist):
   ```bash
   cd backend
   touch .env
   ```

2. **Add your Google Maps API key** to the `.env` file:
   ```
   GOOGLE_API_KEY=AIzaSy...your_actual_key_here
   ```

   Replace `AIzaSy...your_actual_key_here` with your actual API key from Step 1.

3. **Example `.env` file**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=CommunityHelp
   GOOGLE_API_KEY=your_google_api_key_here
   OPENAI_API_KEY=your_openai_key_here
   ```

## Step 3: Restart Your Backend Server

After adding the API key, restart your backend server:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

## How It Works

The system will:
1. **Try Google Maps Geocoding API first** (if `GOOGLE_API_KEY` is set)
   - Extracts sector from `administrative_area_level_2` address component
   - Extracts area from sublocality/neighborhood components
   - Provides accurate Bucharest sector information

2. **Fall back to Nominatim** (OpenStreetMap) if Google Maps API is not available
   - Free but less accurate for sector detection

3. **Use location library** as final fallback
   - Predefined Bucharest locations with sectors

## Testing

To test if your API key is working:

1. Check the backend console logs when processing alerts with coordinates
2. The system will automatically use Google Maps if the key is available
3. You should see more accurate sector detection in the location hierarchy

## Important Notes

- **Never commit your `.env` file** to git! It should already be in `.gitignore`
- **Keep your API key secure** - don't share it publicly
- **Monitor API usage** in Google Cloud Console to avoid unexpected charges
- Google Maps Platform has a **free tier** with generous limits for Geocoding API

## API Pricing

Google Maps Platform Geocoding API:
- **Free tier**: $200 credit per month (covers ~40,000 requests)
- **After free tier**: $5.00 per 1,000 requests
- Check current pricing: https://developers.google.com/maps/billing-and-pricing/pricing

## Troubleshooting

If reverse geocoding isn't working:
1. Verify your API key is correct in `.env`
2. Check that Geocoding API is enabled in Google Cloud Console
3. Check API key restrictions (make sure Geocoding API is allowed)
4. Check backend console logs for error messages
5. Verify the API key has billing enabled (required for Google Maps Platform)

