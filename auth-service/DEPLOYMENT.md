# Deployment Guide

This guide explains how to deploy the frontend to Netlify with the backend running on ngrok.

## Prerequisites

1. **ngrok** installed and configured
2. **Netlify** account
3. Backend running on port 8000

## Step 1: Start Backend with ngrok

1. Start your backend server on port 8000:
   ```bash
   cd auth-service/backend
   python run_server.py
   ```

2. In a separate terminal, start ngrok with the ignore warnings header:
   ```bash
   ngrok http 8000 --request-header-add "ngrok-skip-browser-warning:true"
   ```

3. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

## Step 2: Configure Backend CORS

The backend CORS is already configured to allow ngrok domains. The configuration in `app/main.py` automatically allows:
- Any `*.ngrok.io` or `*.ngrok-free.app` domain
- The `CORS_ORIGIN` from your `.env` file
- Localhost for local development

**Optional:** If you want to explicitly set the ngrok URL, add it to your backend `.env` file:
```env
NGROK_URL=https://your-ngrok-url.ngrok-free.app
```

## Step 3: Build Frontend

1. Navigate to the frontend directory:
   ```bash
   cd auth-service/frontend
   ```

2. Create a `.env` file (or `.env.production`) with your ngrok URL:
   ```env
   VITE_API_URL=https://your-ngrok-url.ngrok-free.app
   ```
   Replace `your-ngrok-url.ngrok-free.app` with your actual ngrok URL.

3. Build the frontend:
   ```bash
   npm run build
   ```

   This will create a `dist` folder with the production build.

## Step 4: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `auth-service/frontend/dist` folder
4. Your site will be deployed!

### Option B: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Navigate to the dist folder:
   ```bash
   cd auth-service/frontend/dist
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

## Step 5: Update CORS for Netlify URL (Optional)

If you want to explicitly allow your Netlify URL, update your backend `.env` file:
```env
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

Or add it to the `allowed_origins` list in `app/main.py`.

## Important Notes

- **ngrok URLs change**: Each time you restart ngrok (unless using a paid plan with static domain), you'll get a new URL. You'll need to:
  1. Update `VITE_API_URL` in the frontend `.env` file
  2. Rebuild the frontend (`npm run build`)
  3. Redeploy to Netlify

- **Netlify SPA Routing**: The `_redirects` file in the `dist` folder ensures React Router works correctly on Netlify.

- **Environment Variables**: Make sure to set `VITE_API_URL` before building, as Vite embeds environment variables at build time.

## Troubleshooting

- **CORS errors**: Make sure your ngrok URL is accessible and the backend is running
- **404 errors on routes**: Ensure the `_redirects` file is in your `dist` folder
- **API not connecting**: Verify `VITE_API_URL` matches your current ngrok URL

