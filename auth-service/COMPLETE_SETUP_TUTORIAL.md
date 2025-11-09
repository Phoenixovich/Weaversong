# Complete Setup Tutorial - From Zero to Deployment

This is a comprehensive, step-by-step guide to set up and deploy the application from scratch. Follow each section in order.

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Backend Setup](#2-backend-setup)
3. [Frontend Setup](#3-frontend-setup)
4. [Testing Locally](#4-testing-locally)
5. [Setting Up ngrok](#5-setting-up-ngrok)
6. [Building for Production](#6-building-for-production)
7. [Deploying to Netlify](#7-deploying-to-netlify)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### 1.1 Install Python

**Windows:**
1. Download Python 3.8+ from [python.org](https://www.python.org/downloads/)
2. During installation, check "Add Python to PATH"
3. Verify installation:
   ```bash
   python --version
   ```
   Should show: `Python 3.x.x`

**Mac:**
```bash
# Check if Python is installed
python3 --version

# If not installed, use Homebrew:
brew install python3
```

**Linux:**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
python3 --version
```

### 1.2 Install Node.js and npm

1. Download Node.js 16+ from [nodejs.org](https://nodejs.org/)
2. Install the LTS version (recommended)
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```
   Should show version numbers for both.

### 1.3 Install ngrok

**Windows:**
1. Download ngrok from [ngrok.com/download](https://ngrok.com/download)
2. Extract the `ngrok.exe` file
3. Add ngrok to your PATH, or place it in a folder you can access
4. Verify installation:
   ```bash
   ngrok version
   ```

**Mac:**
```bash
# Using Homebrew
brew install ngrok/ngrok/ngrok

# Or download from ngrok.com
```

**Linux:**
```bash
# Download and install
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**Sign up for ngrok:**
1. Go to [ngrok.com](https://ngrok.com) and create a free account
2. Get your authtoken from the dashboard
3. Configure ngrok:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### 1.4 Set Up MongoDB Atlas (Database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (choose the free tier)
4. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Username: `your-username`
   - Password: `your-password` (save this!)
   - Database User Privileges: "Atlas admin" or "Read and write to any database"
5. Whitelist your IP:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (for development) or add your specific IP
6. Get your connection string:
   - Go to "Database" → "Connect" → "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with your actual password

### 1.5 Get Gemini API Key (Optional but Recommended)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (you'll need this later)

### 1.6 Create Netlify Account

1. Go to [netlify.com](https://www.netlify.com)
2. Sign up for a free account (you can use GitHub, GitLab, or email)

---

## 2. Backend Setup

### 2.1 Navigate to Backend Directory

Open a terminal/command prompt and navigate to the project:

```bash
cd path/to/Weaversong/auth-service/backend
```

**Windows Example:**
```bash
cd C:\Users\andre\Desktop\Facult8\Openhack\Weaversong\auth-service\backend
```

### 2.2 Create Python Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` at the beginning of your command prompt, indicating the virtual environment is active.

### 2.3 Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install all required packages. Wait for it to complete (may take a few minutes).

### 2.4 Create Backend .env File

Create a new file named `.env` in the `backend` directory (same folder as `requirements.txt`).

**Windows:**
```bash
# In the backend directory
notepad .env
```

**Mac/Linux:**
```bash
nano .env
# or
code .env
```

**Add the following content to the .env file:**

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=CommunityHelp
JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-random
JWT_EXPIRES_MIN=30
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key-here
```

**Important:**
- Replace `your-username` and `your-password` with your MongoDB Atlas credentials
- Replace the entire `MONGODB_URI` with your actual connection string from MongoDB Atlas
- Replace `your-super-secret-jwt-key-change-this-to-something-random` with a random string (e.g., use a password generator)
- Replace `your-gemini-api-key-here` with your Gemini API key (or leave empty if you don't have one)

**Example of a real .env file:**
```env
MONGODB_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=CommunityHelp
JWT_SECRET=a7f3k9m2p8q1w4e6r9t0y2u5i8o1p3a6s9d2f5g8h1j4k7l0z3x6c9v2b5n8m1
JWT_EXPIRES_MIN=30
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

### 2.5 Test Database Connection (Optional but Recommended)

```bash
python test_db_connection.py
```

You should see:
```
✅ MongoDB connection successful!
Database: CommunityHelp
```

If you see an error, check:
- Your `MONGODB_URI` in the `.env` file
- Your IP is whitelisted in MongoDB Atlas
- Your username and password are correct

### 2.6 Start the Backend Server

```bash
python run_server.py
```

Or alternatively:
```bash
uvicorn app.main:app --reload --port 8000
```

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Keep this terminal window open!** The backend must stay running.

### 2.7 Verify Backend is Running

Open your web browser and visit:
- `http://localhost:8000` - Should show: `{"message":"Unified Service API",...}`
- `http://localhost:8000/docs` - FastAPI interactive documentation (Swagger UI)
- `http://localhost:8000/health` - Should show: `{"status":"healthy"}`

If these work, your backend is running correctly! ✅

---

## 3. Frontend Setup

### 3.1 Open a New Terminal Window

Keep the backend terminal running, and open a **new terminal window** for the frontend.

### 3.2 Navigate to Frontend Directory

```bash
cd path/to/Weaversong/auth-service/frontend
```

**Windows Example:**
```bash
cd C:\Users\andre\Desktop\Facult8\Openhack\Weaversong\auth-service\frontend
```

### 3.3 Install Node.js Dependencies

```bash
npm install
```

This will download and install all required packages. Wait for it to complete (may take a few minutes).

### 3.4 Create Frontend .env File

Create a new file named `.env` in the `frontend` directory.

**Windows:**
```bash
notepad .env
```

**Mac/Linux:**
```bash
nano .env
```

**Add the following content:**

```env
VITE_API_URL=http://localhost:8000
```

This tells the frontend where to find the backend API.

### 3.5 Start the Frontend Development Server

```bash
npm run dev
```

You should see output like:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3.6 Verify Frontend is Running

Open your web browser and visit:
- `http://localhost:5173` - Should show the application login/signup page

If you see the application, your frontend is running correctly! ✅

---

## 4. Testing Locally

### 4.1 Test the Full Application

1. Open `http://localhost:5173` in your browser
2. Click "Sign up" to create a new account
3. Fill in:
   - Email: `test@example.com`
   - Username: `testuser`
   - Name: `Test User`
   - Password: `testpassword123`
4. Click "Sign up"
5. You should be redirected to the dashboard

### 4.2 Verify User in Database

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to your cluster → "Browse Collections"
3. Select the `CommunityHelp` database
4. Open the `Users` collection
5. You should see your newly created user!

If everything works, you're ready to deploy! 🎉

---

## 5. Setting Up ngrok

ngrok creates a public URL that tunnels to your local backend server.

### 5.1 Start ngrok

Open a **third terminal window** and run:

```bash
ngrok http 8000 --request-header-add "ngrok-skip-browser-warning:true"
```

You should see output like:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:8000
```

### 5.2 Copy Your ngrok URL

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`). You'll need this in the next step.

**Important:** 
- This URL will change every time you restart ngrok (unless you have a paid plan)
- Keep ngrok running while you build and deploy
- If you restart ngrok, you'll get a new URL and need to rebuild the frontend

### 5.3 Test ngrok URL

Open your browser and visit your ngrok URL:
- `https://your-ngrok-url.ngrok-free.app` - Should show the same API message as localhost:8000
- `https://your-ngrok-url.ngrok-free.app/docs` - Should show the API documentation

If these work, ngrok is set up correctly! ✅

**Keep ngrok running!** You'll need it for the deployment.

---

## 6. Building for Production

### 6.1 Update Frontend .env File

Update the frontend `.env` file with your ngrok URL:

```env
VITE_API_URL=https://your-ngrok-url.ngrok-free.app
```

**Replace `your-ngrok-url.ngrok-free.app` with your actual ngrok URL!**

**Example:**
```env
VITE_API_URL=https://abc123.ngrok-free.app
```

### 6.2 Build the Frontend

In your frontend terminal (or a new terminal in the frontend directory):

```bash
cd auth-service/frontend
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle and optimize all files
- Create a `dist` folder with production-ready files

You should see output like:
```
vite v5.0.8 building for production...
✓ 1234 modules transformed.
dist/index.html                   1.23 kB
dist/assets/index-abc123.js       245.67 kB
...
✓ built in 15.23s
```

### 6.3 Verify Build Output

Check that the `dist` folder was created:

**Windows:**
```bash
dir dist
```

**Mac/Linux:**
```bash
ls dist
```

You should see files like:
- `index.html`
- `assets/` folder with JavaScript and CSS files
- `_redirects` file (for Netlify routing)

---

## 7. Deploying to Netlify

### 7.1 Method 1: Drag and Drop (Easiest)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Sign in to your account
3. On the dashboard, find the section that says "Want to deploy a new site without connecting to Git?"
4. Click "Add new site" → "Deploy manually"
5. You'll see a box that says "Drag and drop your site output folder here"
6. Navigate to: `Weaversong/auth-service/frontend/dist`
7. Drag the entire `dist` folder into the Netlify box
8. Wait for deployment to complete (usually 30-60 seconds)

### 7.2 Method 2: Using Netlify CLI

1. Install Netlify CLI (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. Navigate to the dist folder:
   ```bash
   cd auth-service/frontend/dist
   ```

3. Login to Netlify:
   ```bash
   netlify login
   ```
   This will open a browser window for authentication.

4. Deploy:
   ```bash
   netlify deploy --prod
   ```

5. Follow the prompts:
   - If this is your first deploy, it will ask to create a new site
   - Choose a site name or let Netlify generate one
   - Wait for deployment

### 7.3 Get Your Netlify URL

After deployment, Netlify will give you a URL like:
- `https://your-site-name.netlify.app`

This is your live application URL! 🎉

### 7.4 Test Your Deployed Application

1. Open your Netlify URL in a browser
2. Try to sign up or log in
3. If it works, your deployment is successful!

### 7.5 (Optional) Update Backend CORS for Netlify

If you want to explicitly allow your Netlify URL, you can update your backend `.env`:

```env
CORS_ORIGIN=https://your-site-name.netlify.app
```

However, this is optional because:
- The backend already allows ngrok domains (which your frontend uses)
- The frontend makes requests to ngrok, not directly to localhost

---

## 8. Troubleshooting

### 8.1 Backend Issues

**Problem: Backend won't start**
- ✅ Check that the virtual environment is activated (you should see `(venv)` in your prompt)
- ✅ Verify all dependencies are installed: `pip install -r requirements.txt`
- ✅ Check that port 8000 is not in use by another application
- ✅ Verify the `.env` file exists and has correct values
- ✅ Check for typos in the `.env` file

**Problem: Database connection errors**
- ✅ Verify `MONGODB_URI` in `.env` is correct
- ✅ Check that your IP is whitelisted in MongoDB Atlas
- ✅ Verify username and password are correct (no extra spaces)
- ✅ Test connection: `python test_db_connection.py`

**Problem: CORS errors**
- ✅ Verify `CORS_ORIGIN` in backend `.env` matches your frontend URL
- ✅ The backend now automatically allows ngrok domains, so this should work

### 8.2 Frontend Issues

**Problem: Frontend won't start**
- ✅ Check Node.js is installed: `node --version`
- ✅ Verify dependencies are installed: `npm install`
- ✅ Check that port 5173 is not in use
- ✅ Verify `.env` file exists with `VITE_API_URL`

**Problem: Frontend can't connect to backend**
- ✅ Verify backend is running on port 8000
- ✅ Check `VITE_API_URL` in frontend `.env` matches your backend URL
- ✅ For production, make sure `VITE_API_URL` is set to your ngrok URL

**Problem: Build fails**
- ✅ Make sure you're in the frontend directory
- ✅ Try deleting `node_modules` and running `npm install` again
- ✅ Check for TypeScript errors: `npm run build` will show them

### 8.3 ngrok Issues

**Problem: ngrok command not found**
- ✅ Make sure ngrok is installed and in your PATH
- ✅ Try using the full path to ngrok.exe (Windows)
- ✅ On Mac/Linux, you may need: `./ngrok http 8000`

**Problem: ngrok URL not working**
- ✅ Make sure your backend is running on port 8000
- ✅ Verify ngrok is forwarding to the correct port
- ✅ Check the ngrok web interface at `http://127.0.0.1:4040` for details

**Problem: ngrok shows "This site can't be reached"**
- ✅ This is normal for free ngrok - you'll see a warning page first
- ✅ Click "Visit Site" to proceed
- ✅ The `--request-header-add` flag should help skip this, but it may still appear

### 8.4 Netlify Issues

**Problem: Deployment fails**
- ✅ Make sure you're deploying the `dist` folder, not the `frontend` folder
- ✅ Check that `npm run build` completed successfully
- ✅ Verify the `dist` folder contains `index.html`

**Problem: App shows 404 on routes**
- ✅ Make sure the `_redirects` file is in your `dist` folder
- ✅ It should contain: `/*    /index.html   200`
- ✅ If missing, it should be in `frontend/public/_redirects` and will be copied during build

**Problem: API calls fail on Netlify**
- ✅ Verify `VITE_API_URL` in frontend `.env` is set to your ngrok URL
- ✅ Make sure you rebuilt after setting the ngrok URL: `npm run build`
- ✅ Check that ngrok is still running
- ✅ Verify backend CORS allows ngrok domains (it should automatically)

### 8.5 Common Mistakes

1. **Forgot to update VITE_API_URL before building**
   - Solution: Update `.env`, then rebuild: `npm run build`

2. **ngrok URL changed but didn't rebuild**
   - Solution: Every time ngrok restarts, you get a new URL. Update `.env` and rebuild.

3. **Deployed wrong folder**
   - Solution: Make sure to deploy `frontend/dist`, not `frontend` or `backend`

4. **Backend not running when testing**
   - Solution: Backend must be running for the app to work. Keep it running!

5. **Virtual environment not activated**
   - Solution: Always activate venv before running backend commands

---

## 🎉 Congratulations!

You've successfully:
- ✅ Set up the backend with MongoDB
- ✅ Set up the frontend with React
- ✅ Configured ngrok for public backend access
- ✅ Built the production frontend
- ✅ Deployed to Netlify

Your application is now live on the internet! 🚀

---

## 📝 Quick Reference Commands

**Backend:**
```bash
cd auth-service/backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
python run_server.py
```

**Frontend (Development):**
```bash
cd auth-service/frontend
npm run dev
```

**Frontend (Production Build):**
```bash
cd auth-service/frontend
# Update .env with ngrok URL first!
npm run build
```

**ngrok:**
```bash
ngrok http 8000 --request-header-add "ngrok-skip-browser-warning:true"
```

**Deploy to Netlify:**
- Drag `auth-service/frontend/dist` to Netlify dashboard
- Or: `cd auth-service/frontend/dist && netlify deploy --prod`

---

## 🔄 Updating Your Deployment

If you make changes or ngrok URL changes:

1. **Update frontend .env** with new ngrok URL
2. **Rebuild:** `cd auth-service/frontend && npm run build`
3. **Redeploy:** Drag `dist` folder to Netlify again, or use `netlify deploy --prod`

---

## 💡 Tips

- **Keep ngrok running** while your app is deployed
- **Use a static ngrok domain** (paid feature) if you want a permanent URL
- **Set up environment variables in Netlify** for easier management (optional)
- **Monitor your MongoDB Atlas usage** to stay within free tier limits
- **Check Netlify deploy logs** if something goes wrong

---

## 🆘 Need Help?

If you encounter issues not covered here:
1. Check the error messages carefully
2. Verify all environment variables are set correctly
3. Make sure all services are running (backend, ngrok)
4. Check the browser console for frontend errors
5. Check backend terminal for server errors

Good luck! 🍀

