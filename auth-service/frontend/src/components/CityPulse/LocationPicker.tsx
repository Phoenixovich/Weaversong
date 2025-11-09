import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LocationPickerProps {
  initialLat?: number | null
  initialLng?: number | null
  onLocationSelect: (location: {
    lat: number
    lng: number
    address: string | null
    area: string | null
    sector: string | null
  }) => void
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      onLocationSelect(lat, lng)
    },
  })
  return null
}

export default function LocationPicker({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) {
  const [selectedLat, setSelectedLat] = useState<number | null>(initialLat || null)
  const [selectedLng, setSelectedLng] = useState<number | null>(initialLng || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [locationInfo, setLocationInfo] = useState<{
    address: string | null
    area: string | null
    sector: string | null
  } | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Bucharest center coordinates
  const BUCHAREST_CENTER: [number, number] = [44.4378, 26.0967]

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedLat(lat)
    setSelectedLng(lng)
    await geocodeLocation(lat, lng)
  }

  const geocodeLocation = async (lat: number, lng: number) => {
    setIsGeocoding(true)
    try {
      const response = await fetch(`/citypulse/alerts/location/geocode?lat=${lat}&lng=${lng}`, {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to geocode location')
      }
      const data = await response.json()
      setLocationInfo({
        address: data.address,
        area: data.area,
        sector: data.sector,
      })
      onLocationSelect({
        lat,
        lng,
        address: data.address,
        area: data.area,
        sector: data.sector,
      })
    } catch (error) {
      console.error('Geocoding error:', error)
      setLocationInfo(null)
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) {
      window.alert('Please enter a location name to search')
      return
    }

    setIsSearching(true)
    setSearchResults([])
    try {
      console.log('Searching for:', trimmedQuery)
      const response = await fetch('/citypulse/alerts/location/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: trimmedQuery }),
      })
      
      console.log('Search response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Search error response:', errorData)
        throw new Error(errorData.detail || `Search failed with status ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Search response data:', data)
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results)
        console.log('Search results:', data.results)
      } else {
        setSearchResults([])
        const message = data.message || 'No locations found. Try searching for a specific area in Bucharest (e.g., "Herastrau", "Piata Unirii", "Sector 1").'
        window.alert(message)
      }
    } catch (error: any) {
      console.error('Search error:', error)
      setSearchResults([])
      const errorMessage = error.message || 'Unknown error occurred. Please check your connection and try again.'
      window.alert(`Search failed: ${errorMessage}`)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSearchResult = async (result: any) => {
    setSelectedLat(result.lat)
    setSelectedLng(result.lng)
    setSearchQuery('')
    setSearchResults([])
    setLocationInfo({
      address: result.address,
      area: result.area,
      sector: result.sector,
    })
    onLocationSelect({
      lat: result.lat,
      lng: result.lng,
      address: result.address,
      area: result.area,
      sector: result.sector,
    })
  }

  // Geocode initial location if provided
  useEffect(() => {
    if (initialLat && initialLng && !selectedLat && !selectedLng) {
      handleMapClick(initialLat, initialLng)
    }
  }, [initialLat, initialLng])

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
            placeholder="Search for location in Bucharest (e.g., Herastrau, Piata Unirii, Sector 1)..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : '🔍 Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute z-[1000] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectSearchResult(result)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
              >
                <div className="font-medium">{result.address}</div>
                {result.area && (
                  <div className="text-sm text-gray-600">
                    {result.area} {result.sector && `• ${result.sector}`}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="w-full h-96 border border-gray-300 rounded-lg overflow-hidden">
        <MapContainer
          {...({ center: selectedLat && selectedLng ? [selectedLat, selectedLng] : BUCHAREST_CENTER } as any)}
          zoom={selectedLat && selectedLng ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any)}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selectedLat && selectedLng && (
            <Marker position={[selectedLat, selectedLng]} />
          )}
          <MapClickHandler onLocationSelect={handleMapClick} />
        </MapContainer>
      </div>

      {/* Location Info */}
      {isGeocoding && (
        <div className="text-sm text-gray-600">📍 Getting location information...</div>
      )}
      {locationInfo && !isGeocoding && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-900">Selected Location:</div>
          {locationInfo.address && (
            <div className="text-sm text-blue-800 mt-1">📍 {locationInfo.address}</div>
          )}
          <div className="text-sm text-blue-700 mt-1">
            {locationInfo.area && <span>🏘️ {locationInfo.area}</span>}
            {locationInfo.sector && (
              <span className="ml-2">🏛️ {locationInfo.sector}</span>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500">
        💡 Click on the map to select a location, or search for a place name. Only locations in Bucharest are allowed.
      </div>
    </div>
  )
}

