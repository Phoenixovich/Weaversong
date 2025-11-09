from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, clarify, reminders, public_data
from app.routers import helpboard_requests, helpboard_responses, helpboard_users
from app.routers import citypulse_alerts, citypulse_sectors, pedestrian_analytics

app = FastAPI(title="Unified Service", version="1.0.0")

# Build allowed origins list
allowed_origins = [
    settings.cors_origin,
    "http://localhost:5173",
    "http://localhost:5174",
]

# Add ngrok URL from environment if provided
ngrok_url = getattr(settings, 'ngrok_url', None)
if ngrok_url:
    allowed_origins.append(ngrok_url)

# CORS middleware - allows localhost, configured CORS_ORIGIN, and any ngrok domain
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r'https?://.*\.(ngrok\.io|ngrok-free\.app).*',  # Allow any ngrok domain
    allow_origins=allowed_origins,  # Explicit origins (localhost, Netlify, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(clarify.router)
app.include_router(reminders.router)
app.include_router(public_data.router)
# Helpboard feature routers
app.include_router(helpboard_requests.router)
app.include_router(helpboard_responses.router)
app.include_router(helpboard_users.router)

# CityPulse routers
app.include_router(citypulse_alerts.router)
app.include_router(citypulse_sectors.router)

# Pedestrian Analytics router
app.include_router(pedestrian_analytics.router)


@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()


@app.get("/")
async def root():
    return {"message": "Unified Service API", "services": ["auth", "clarifai", "citypulse"]}


@app.get("/health")
async def health():
    return {"status": "healthy"}

