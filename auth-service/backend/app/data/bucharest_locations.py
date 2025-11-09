"""
Bucharest location mappings: coordinates to sectors and areas
Stored data for fast lookups without external API calls
"""

# Approximate sector boundaries (simplified rectangular bounds)
# Format: (min_lat, max_lat, min_lng, max_lng)
SECTOR_BOUNDS = {
	"Sector 1": {
		"bounds": (44.4200, 44.4800, 26.0500, 26.1200),  # North-central
		"center": (44.4500, 26.0850)
	},
	"Sector 2": {
		"bounds": (44.3800, 44.4500, 26.0800, 26.1500),  # South-east
		"center": (44.4150, 26.1150)
	},
	"Sector 3": {
		"bounds": (44.4000, 44.4600, 26.0900, 26.1600),  # South-central
		"center": (44.4300, 26.1250)
	},
	"Sector 4": {
		"bounds": (44.3600, 44.4200, 26.1000, 26.1800),  # South
		"center": (44.3900, 26.1400)
	},
	"Sector 5": {
		"bounds": (44.4000, 44.4600, 26.0200, 26.0900),  # West
		"center": (44.4300, 26.0550)
	},
	"Sector 6": {
		"bounds": (44.3800, 44.4400, 26.0000, 26.0800),  # South-west
		"center": (44.4100, 26.0400)
	},
}

# Specific area coordinates (known landmarks)
AREA_COORDINATES = {
	"Gara de Nord": {
		"lat": 44.4475,
		"lng": 26.0750,
		"sector": "Sector 1"
	},
	"Politehnica": {
		"lat": 44.4390,
		"lng": 26.0530,
		"sector": "Sector 1"
	},
	"AFI Cotroceni": {
		"lat": 44.4280,
		"lng": 26.0600,
		"sector": "Sector 5"
	},
	"Herastrau": {
		"lat": 44.4750,
		"lng": 26.0800,
		"sector": "Sector 1"
	},
	"Cismigiu": {
		"lat": 44.4400,
		"lng": 26.0950,
		"sector": "Sector 1"
	},
	"Piata Unirii": {
		"lat": 44.4250,
		"lng": 26.1050,
		"sector": "Sector 3"
	},
	"Piata Victoriei": {
		"lat": 44.4500,
		"lng": 26.0900,
		"sector": "Sector 1"
	},
	"Calea Victoriei": {
		"lat": 44.4475,
		"lng": 26.0975,
		"sector": "Sector 1"
	},
	"Bulevardul Magheru": {
		"lat": 44.4450,
		"lng": 26.1000,
		"sector": "Sector 1"
	},
	"Lipscani": {
		"lat": 44.4319,
		"lng": 26.1028,
		"sector": "Sector 3"
	},
	"Carturesti Carusel": {
		"lat": 44.4319,
		"lng": 26.1028,
		"sector": "Sector 3"
	},
	"Drumul Taberei": {
		"lat": 44.4100,
		"lng": 26.0300,
		"sector": "Sector 6"
	},
	"Militari": {
		"lat": 44.4200,
		"lng": 26.0200,
		"sector": "Sector 6"
	},
	"Berceni": {
		"lat": 44.3800,
		"lng": 26.1200,
		"sector": "Sector 4"
	},
	"Pantelimon": {
		"lat": 44.4000,
		"lng": 26.1300,
		"sector": "Sector 2"
	},
	"Titan": {
		"lat": 44.4200,
		"lng": 26.1400,
		"sector": "Sector 3"
	},
	"Vitan": {
		"lat": 44.4100,
		"lng": 26.1300,
		"sector": "Sector 3"
	},
	"Rahova": {
		"lat": 44.4300,
		"lng": 26.0500,
		"sector": "Sector 5"
	},
	"Crangasi": {
		"lat": 44.4400,
		"lng": 26.0400,
		"sector": "Sector 6"
	},
	"Giulesti": {
		"lat": 44.4500,
		"lng": 26.0300,
		"sector": "Sector 6"
	},
	"Baneasa": {
		"lat": 44.5100,
		"lng": 26.0800,
		"sector": "Sector 1"
	},
	"Otopeni": {
		"lat": 44.5500,
		"lng": 26.0800,
		"sector": "Sector 1"
	},
}

def get_sector_from_coords(lat: float, lng: float) -> str | None:
	"""
	Get sector from coordinates using stored bounds
	Returns sector name or None
	"""
	for sector_name, data in SECTOR_BOUNDS.items():
		min_lat, max_lat, min_lng, max_lng = data["bounds"]
		if min_lat <= lat <= max_lat and min_lng <= lng <= max_lng:
			return sector_name
	return None

def get_area_from_coords(lat: float, lng: float, threshold: float = 0.01) -> tuple[str | None, str | None]:
	"""
	Get area and sector from coordinates
	Returns: (area_name, sector_name) or (None, sector_from_bounds)
	threshold: distance in degrees (approx 1km)
	"""
	# First check if coordinates match a known area
	for area_name, area_data in AREA_COORDINATES.items():
		area_lat = area_data["lat"]
		area_lng = area_data["lng"]
		# Calculate distance (simple Euclidean distance in degrees)
		lat_diff = abs(lat - area_lat)
		lng_diff = abs(lng - area_lng)
		distance = (lat_diff ** 2 + lng_diff ** 2) ** 0.5
        
		if distance <= threshold:
			return area_name, area_data["sector"]
    
	# If no area match, try to get sector from bounds
	sector = get_sector_from_coords(lat, lng)
	return None, sector

def get_area_sector_from_point(lat: float, lng: float) -> dict:
	"""
	Get area and sector from point coordinates
	Returns: {"area": str | None, "sector": str | None}
	"""
	area, sector = get_area_from_coords(lat, lng)
	return {
		"area": area,
		"sector": sector
	}

