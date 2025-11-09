# Authentication Service

Full-stack authentication service with React frontend and FastAPI backend.

## Project Structure

```
auth-service/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── models/   # Pydantic models
│   │   ├── routers/  # API routes
│   │   ├── services/ # Business logic
│   │   ├── utils/    # Utilities (JWT, password hashing)
│   │   └── middleware/ # Auth middleware
│   └── requirements.txt
└── frontend/         # React + Vite + TypeScript
    ├── src/
    │   ├── pages/    # Page components
    │   ├── components/ # Reusable components
    │   ├── contexts/  # React contexts
    │   ├── services/ # API services
    │   └── types/    # TypeScript types
    └── package.json
```

## Features

### Backend
- ✅ User signup with email and username
- ✅ User login with JWT token generation
- ✅ Password hashing with bcrypt
- ✅ JWT token refresh endpoint
- ✅ Protected routes with JWT middleware
- ✅ MongoDB user storage
- ✅ CORS configuration

### Frontend
- ✅ Signup and login pages
- ✅ Protected routes
- ✅ Auth context for state management
- ✅ Automatic token refresh on 401 errors
- ✅ Token storage in localStorage
- ✅ User dashboard

## Quick Start

> **📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)**  
> **🚀 For complete deployment tutorial from zero, see [COMPLETE_SETUP_TUTORIAL.md](./COMPLETE_SETUP_TUTORIAL.md)**

### Backend Setup

1. Navigate to backend directory:
```bash
cd Weaversong/auth-service/backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file in the `backend` directory:
```
MONGODB_URI=
MONGODB_DB=
JWT_SECRET=
JWT_EXPIRES_MIN=30
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=
```

**Note:** Database name is set to `CommunityHelp` and users are stored in the `Users` collection.

4. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd Weaversong/auth-service/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (or use the provided one):
```
VITE_API_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

- `POST /auth/signup` - Register a new user
  - Body: `{ "email": "user@example.com", "username": "username", "name": "Full Name", "password": "password" }`
  
- `POST /auth/login` - Login and get access token
  - Body: `{ "email": "user@example.com", "password": "password" }`
  - Returns: `{ "access_token": "...", "token_type": "bearer", "user": {...} }`

- `POST /auth/logout` - Logout (requires authentication)
  
- `POST /auth/refresh` - Refresh access token (requires authentication)
  - Returns: `{ "access_token": "...", "token_type": "bearer" }`

- `GET /auth/me` - Get current user info (requires authentication)
  - Returns: `{ "id": "...", "email": "...", "username": "...", "name": "...", "date_created": "..." }`

## Usage

1. **Test database connection** (optional but recommended):
   ```bash
   cd backend
   python test_db_connection.py
   ```

2. **Start the backend server** (port 8000):
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

3. **Start the frontend server** (port 5173) in a new terminal:
   ```bash
   cd frontend
   npm run dev
   ```

4. Navigate to `http://localhost:5173`
5. Sign up for a new account (email, username, name, password)
6. Access the protected dashboard
7. Verify user was created in MongoDB Atlas: `CommunityHelp` database → `Users` collection

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens with configurable expiration
- Protected routes require valid JWT token
- Automatic token refresh on expiration
- CORS protection

## Deployment

> **📖 For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Deployment Steps

1. **Start backend with ngrok:**
   ```bash
   # Terminal 1: Start backend
   cd auth-service/backend
   python run_server.py
   
   # Terminal 2: Start ngrok
   ngrok http 8000 --request-header-add "ngrok-skip-browser-warning:true"
   ```

2. **Build frontend:**
   ```bash
   cd auth-service/frontend
   # Create .env with: VITE_API_URL=https://your-ngrok-url.ngrok-free.app
   npm run build
   ```

3. **Deploy to Netlify:**
   - Drag and drop the `auth-service/frontend/dist` folder to Netlify
   - Or use Netlify CLI: `netlify deploy --prod`

The backend CORS is already configured to allow ngrok domains automatically.

