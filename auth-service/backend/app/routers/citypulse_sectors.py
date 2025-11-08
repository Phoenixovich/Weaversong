from fastapi import APIRouter
from typing import Dict, List

from app.data.bucharest_locations import SECTOR_BOUNDS, AREA_COORDINATES

router = APIRouter(prefix="/citypulse/sectors", tags=["citypulse"])


@router.get("", response_model=Dict[str, List[str]])
async def get_sectors_and_areas():
	"""Return available sectors and areas for CityPulse (used by frontend filters)."""
	sectors = list(SECTOR_BOUNDS.keys())
	areas = list(AREA_COORDINATES.keys())
	return {"sectors": sectors, "areas": areas}

