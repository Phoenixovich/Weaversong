# Auth Service Backend

FastAPI backend for authentication service with MongoDB.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the `backend` directory with:
```
MONGODB_URI=
MONGODB_DB=
JWT_SECRET=
JWT_EXPIRES_MIN=30
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=
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

