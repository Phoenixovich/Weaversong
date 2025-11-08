# Quick Start Guide

## 🚀 Fast Setup (Copy & Paste)

### Terminal 1 - Backend
```bash
cd Weaversong/auth-service/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
MONGODB_URI=
MONGODB_DB=
JWT_SECRET=
JWT_EXPIRES_MIN=30
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=
```

```bash
# Test connection (optional)
python test_db_connection.py

# Start server
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 - Frontend
```bash
cd Weaversong/auth-service/frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

### ✅ Verify Everything Works

1. **Backend**: Open http://localhost:8000 - Should show `{"message":"Auth Service API"}`
2. **Backend Docs**: Open http://localhost:8000/docs - FastAPI interactive docs
3. **Frontend**: Open http://localhost:5173 - Should show login page
4. **Database**: Sign up a user, then check MongoDB Atlas → `CommunityHelp` database → `Users` collection

## 🔍 Troubleshooting

**Backend not starting?**
- Check `.env` file exists in `backend/` directory
- Verify virtual environment is activated
- Check port 8000 is not in use

**Frontend not starting?**
- Check `.env` file exists in `frontend/` directory
- Run `npm install` again
- Check port 5173 is not in use

**Database connection issues?**
- Run `python backend/test_db_connection.py`
- Check MongoDB Atlas network access (allow your IP)
- Verify `MONGODB_URI` in `.env` is correct

**CORS errors?**
- Verify `CORS_ORIGIN=http://localhost:5173` in backend `.env`
- Make sure both servers are running

