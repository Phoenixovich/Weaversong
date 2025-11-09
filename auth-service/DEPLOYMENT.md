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

### Option A: Deploy via Netlify Dashboard (Manual Upload)

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `auth-service/frontend/dist` folder
4. Your site will be deployed!

### Option B: Deploy via Netlify Dashboard (Git Integration)

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Base directory:** `auth-service/frontend` (or leave empty if deploying from root)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist` (relative to base directory)
5. Add environment variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-ngrok-url.ngrok-free.app`
6. Click "Deploy site"

**Note:** The `netlify.toml` file in the frontend directory will automatically configure these settings if you're using Git integration.

### Option C: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Navigate to the frontend directory:
   ```bash
   cd auth-service/frontend
   ```

3. Login to Netlify:
   ```bash
   netlify login
   ```

4. Initialize and deploy:
   ```bash
   netlify init
   # Follow the prompts, or use:
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

### Build Command Errors

If you see errors like `'remix' is not recognized` or wrong build commands:

1. **Check Netlify Build Settings:**
   - Go to Site settings → Build & deploy → Build settings
   - **Base directory:** Should be `auth-service/frontend` (or empty if deploying from root)
   - **Build command:** Should be `npm run build`
   - **Publish directory:** Should be `dist` (relative to base directory)

2. **Or use the `netlify.toml` file:**
   - The `netlify.toml` file in `auth-service/frontend/` automatically configures these settings
   - Make sure it's committed to your repository if using Git integration

### CORS Errors (Frontend trying to connect to localhost)

If you see errors like:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:8000/...
```

**This means the frontend was built with `VITE_API_URL=http://localhost:8000` instead of your ngrok URL.**

**Solution:**

1. **If using Netlify Git Integration:**
   - Go to Netlify Dashboard → Your Site → Site settings → Environment variables
   - Add/Update: `VITE_API_URL` = `https://your-ngrok-url.ngrok-free.app`
   - Trigger a new deploy (Deploys → Trigger deploy → Clear cache and deploy site)

2. **If using Manual Deploy:**
   - Update `auth-service/frontend/.env` with your ngrok URL:
     ```env
     VITE_API_URL=https://your-ngrok-url.ngrok-free.app
     ```
   - Rebuild: `cd auth-service/frontend && npm run build`
   - Redeploy the `dist` folder to Netlify

**Important:** Vite embeds environment variables at build time, so you MUST rebuild after changing `VITE_API_URL`.

### Other Issues

- **404 errors on routes**: Ensure the `_redirects` file is in your `dist` folder (it's automatically included via `public/_redirects`)
- **Build fails**: Make sure Node.js version is set correctly in Netlify (should be 16+)
- **Backend not accessible**: Make sure ngrok is running and the URL is correct

