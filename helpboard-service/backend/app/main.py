from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import db
from .routes import auth, users, requests, responses
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(title="Helpboard API")

# ✅ Configure CORS
origins = [
    os.getenv("CORS_ORIGIN", "http://localhost:5173"),  # default frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Allow React app
    allow_credentials=True,
    allow_methods=["*"],            # Allow all HTTP verbs (GET, POST, PUT, DELETE)
    allow_headers=["*"],            # Allow all headers (including Authorization)
)

# ✅ Include route modules
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/helpboard/users", tags=["Users"])
app.include_router(requests.router, prefix="/helpboard/requests", tags=["Requests"])
app.include_router(responses.router, prefix="/helpboard/responses", tags=["Responses"])

# ✅ Verify DB connection on startup
@app.on_event("startup")
async def startup_db_check():
    try:
        await db.command("ping")
        print("✅ MongoDB connection active")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)

# ✅ Root endpoint
@app.get("/")
async def root():
    return {"message": "Helpboard API is running!"}
