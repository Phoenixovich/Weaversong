from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import pedestrian

app = FastAPI(title="Pedestrian Control Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin, "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pedestrian.router)


@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()


@app.get("/")
async def root():
    return {
        "message": "Pedestrian Control Service API",
        "description": "Collect and analyze pedestrian geolocation data",
        "endpoints": {
            "collect_location": "POST /pedestrian/location",
            "collect_batch": "POST /pedestrian/locations/batch",
            "get_locations": "GET /pedestrian/locations",
            "analyze": "POST /pedestrian/analyze",
            "stats": "GET /pedestrian/stats"
        }
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


