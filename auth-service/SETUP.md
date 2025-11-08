# Setup and Run Guide

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ and npm installed
- MongoDB Atlas account (or local MongoDB)

## Step 1: Backend Setup

### 1.1 Navigate to backend directory
```bash
cd Weaversong/auth-service/backend
```

### 1.2 Create a virtual environment (recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 1.3 Install dependencies
```bash
pip install -r requirements.txt
```

### 1.4 Create `.env` file
Create a `.env` file in the `backend` directory with the following content:

```env
MONGODB_URI=mongodb+srv://lucasnegrea_db_user:9sdmHfJhINmLg7sq@cluster0.l4aer7e.mongodb.net/?appName=Cluster0
MONGODB_DB=CommunityHelp
JWT_SECRET=24528b35ededbdcb1a405cd01c60dac5
JWT_EXPIRES_MIN=30
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=AIzaSyBJjGDle8snAX6qc2OCiwY-5yH4Kbwjn-4
```

**Important:** The `MONGODB_DB` should be set to `CommunityHelp` to match your database name.

### 1.5 Test database connection (optional)
```bash
python test_db_connection.py
```

This will verify that your MongoDB connection is working.

### 1.6 Run the backend server
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

The backend API will be available at `http://localhost:8000`

### 1.7 Verify backend is running
Open your browser and go to:
- `http://localhost:8000` - Should show `{"message":"Auth Service API"}`
- `http://localhost:8000/docs` - FastAPI interactive documentation
- `http://localhost:8000/health` - Health check endpoint

## Step 2: Frontend Setup

### 2.1 Open a new terminal window
Keep the backend running in the first terminal, open a new one.

### 2.2 Navigate to frontend directory
```bash
cd Weaversong/auth-service/frontend
```

### 2.3 Install dependencies
```bash
npm install
```

### 2.4 Create `.env` file
Create a `.env` file in the `frontend` directory with:

```env
VITE_API_URL=http://localhost:8000
```

### 2.5 Run the frontend development server
```bash
npm run dev
```

You should see output like:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

The frontend will be available at `http://localhost:5173`

## Step 3: Verify Database Connection

### Option 1: Test via API
1. Open `http://localhost:8000/docs` in your browser
2. Try the `/auth/signup` endpoint with test data
3. If successful, check your MongoDB Atlas dashboard to see the new user in the `CommunityHelp.Users` collection

### Option 2: Use the test script
```bash
cd backend
python test_db_connection.py
```

### Option 3: Check backend logs
When you start the backend, check for any connection errors. If you see:
- `INFO: Application startup complete.` - Connection successful
- Any MongoDB connection errors - Check your `MONGODB_URI` in `.env`

## Step 4: Test the Application

1. Open `http://localhost:5173` in your browser
2. Click "Sign up" to create a new account
3. Fill in the form (email, username, name, password)
4. After signup, you should be redirected to the dashboard
5. Check MongoDB Atlas to verify the user was created in `CommunityHelp.Users` collection

## Troubleshooting

### Backend won't start
- Check that Python virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check that port 8000 is not already in use
- Verify `.env` file exists and has correct values

### Frontend won't start
- Check that Node.js is installed: `node --version`
- Verify dependencies are installed: `npm install`
- Check that port 5173 is not already in use
- Verify `.env` file exists with `VITE_API_URL`

### Database connection issues
- Verify `MONGODB_URI` in backend `.env` is correct
- Check MongoDB Atlas network access (IP whitelist)
- Verify database name is `CommunityHelp`
- Check MongoDB Atlas connection string format

### CORS errors
- Verify `CORS_ORIGIN` in backend `.env` matches frontend URL (`http://localhost:5173`)
- Check that backend is running on port 8000
- Check that frontend is running on port 5173

## Quick Start Commands

**Terminal 1 (Backend):**
```bash
cd Weaversong/auth-service/backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
# Create .env file (see above)
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd Weaversong/auth-service/frontend
npm install
# Create .env file (see above)
npm run dev
```

Then open `http://localhost:5173` in your browser!

