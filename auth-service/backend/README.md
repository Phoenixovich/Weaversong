# Auth Service Backend

FastAPI backend for authentication service with MongoDB.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the `backend` directory with:
```
MONGODB_URI=mongodb+srv://lucasnegrea_db_user:9sdmHfJhINmLg7sq@cluster0.l4aer7e.mongodb.net/?appName=Cluster0
MONGODB_DB=auth_app
JWT_SECRET=24528b35ededbdcb1a405cd01c60dac5
JWT_EXPIRES_MIN=30
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=AIzaSyBJjGDle8snAX6qc2OCiwY-5yH4Kbwjn-4
```

3. Run the server:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login and get access token
- `POST /auth/logout` - Logout (client-side token removal)
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info (protected)

