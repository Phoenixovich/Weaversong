from fastapi import APIRouter, HTTPException, Query
from typing import List
from datetime import datetime

from app.database import get_database
from app.models.citypulse_alert import AlertCreate, AlertResponse, AlertAnalysisRequest
from app.services import ai_analysis

router = APIRouter(prefix="/citypulse/alerts", tags=["citypulse"])


@router.get("", response_model=List[AlertResponse])
async def get_alerts(
	neighborhood: str | None = Query(None, description="Filter by neighborhood/area"),
	category: str | None = Query(None, description="Filter by category"),
	priority: str | None = Query(None, description="Filter by priority"),
):
	"""Get all CityPulse alerts. Tries to use MongoDB if configured; returns empty list if DB not available."""
	try:
		db = get_database()
	except Exception:
		# Database not connected
		raise HTTPException(status_code=503, detail="Database not connected")

	query = {}
	if neighborhood:
		query["neighborhood"] = neighborhood
	if category:
		query["category"] = category
	if priority:
		query["priority"] = priority

	cursor = db.citypulse_alerts.find(query).sort("timestamp", -1)
	alerts = []
	async for doc in cursor:
		alerts.append(AlertResponse(
			id=str(doc.get("_id")),
			title=doc.get("title"),
			description=doc.get("description"),
			category=doc.get("category"),
			priority=doc.get("priority", "Medium"),
			location=doc.get("location", {}),
			location_hierarchy=doc.get("location_hierarchy"),
			neighborhood=doc.get("neighborhood"),
			area_type=doc.get("area_type"),
			timestamp=doc.get("timestamp", 0),
			user_id=doc.get("user_id", ""),
			phone=doc.get("phone"),
			email=doc.get("email"),
			other_contact=doc.get("other_contact"),
		))
	return alerts


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(alert: AlertCreate):
	"""Create a CityPulse alert and persist to MongoDB when available."""
	try:
		db = get_database()
	except Exception:
		raise HTTPException(status_code=503, detail="Database not connected")

	doc = {
		"title": alert.title,
		"description": alert.description,
		"category": alert.category,
		"priority": alert.priority,
		"location": alert.location.model_dump(),
		"location_hierarchy": alert.location_hierarchy.model_dump() if alert.location_hierarchy else None,
		"neighborhood": alert.neighborhood,
		"area_type": alert.area_type,
		"timestamp": int(datetime.now().timestamp()),
		"user_id": alert.username or "",
		"phone": alert.phone,
		"email": alert.email,
		"other_contact": alert.other_contact,
	}

	result = await db.citypulse_alerts.insert_one(doc)
	created = await db.citypulse_alerts.find_one({"_id": result.inserted_id})

	return AlertResponse(
		id=str(created.get("_id")),
		title=created.get("title"),
		description=created.get("description"),
		category=created.get("category"),
		priority=created.get("priority", "Medium"),
		location=created.get("location", {}),
		location_hierarchy=created.get("location_hierarchy"),
		neighborhood=created.get("neighborhood"),
		area_type=created.get("area_type"),
		timestamp=created.get("timestamp", 0),
		user_id=created.get("user_id", ""),
		phone=created.get("phone"),
		email=created.get("email"),
		other_contact=created.get("other_contact"),
	)


@router.post("/analyze", response_model=dict)
async def analyze_alert_text(request: AlertAnalysisRequest):
	"""Lightweight analysis endpoint: extracts a tentative title and default category/priority.
	This is a safe fallback that doesn't call external AI services.
	"""
	text = request.text.strip()
	# Try AI-enhanced analysis first; fallback to local analyzer
	try:
		result = await ai_analysis.analyze_text_with_ai(text, user_lat=request.user_lat, user_lng=request.user_lng, is_speech=request.is_speech)
		return result
	except Exception:
		# Fallback to local analysis
		result = await ai_analysis.analyze_text(text)
		return result

