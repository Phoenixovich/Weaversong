import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import type { Alert, AlertCategory, AlertPriority } from '../../types/citypulse'
import { fetchSectors, type Sector } from '../../services/citypulseApi'
import 'leaflet/dist/leaflet.css'

// Category colors for markers (using hex colors for Leaflet)
const categoryMarkerColors: Record<AlertCategory, string> = {
  Road: '#ef4444',        // red
  Traffic: '#f97316',     // orange
  Safety: '#eab308',      // yellow
  Emergency: '#dc2626',   // dark red
  Crime: '#a855f7',       // purple
  Lost: '#3b82f6',        // blue
  Weather: '#06b6d4',     // cyan
  Environment: '#22c55e', // green
  Infrastructure: '#6366f1', // indigo
  PublicTransport: '#ec4899', // pink
  Construction: '#f59e0b',   // amber
  Event: '#8b5cf6',       // violet
  General: '#6b7280',     // gray
}

// Category emojis for markers
const categoryEmojis: Record<AlertCategory, string> = {
  Road: '🚗',
  Traffic: '🚦',
  Safety: '⚠️',
  Emergency: '🚨',
  Crime: '🔒',
  Lost: '🔍',
  Weather: '🌧️',
  Environment: '🌍',
  Infrastructure: '⚡',
  PublicTransport: '🚇',
  Construction: '🏗️',
  Event: '🎉',
  General: '📢',
}

// Priority sizes (in pixels) - bigger priority means bigger marker
const prioritySizes: Record<AlertPriority, number> = {
  Low: 20,
  Medium: 30,
  High: 40,
  Critical: 50,
}

// Sector colors for visualization
const SECTOR_COLORS: Record<string, string> = {
  "Sector 1": "#3b82f6", // blue
  "Sector 2": "#22c55e", // green
  "Sector 3": "#eab308", // yellow
  "Sector 4": "#ef4444", // red
  "Sector 5": "#a855f7", // purple
  "Sector 6": "#f97316", // orange
}

// Helper function to get sector data by name (for zoom functionality)
const getSectorData = (sectors: Sector[], sectorName: string): Sector | null => {
  return sectors.find(s => s.sector === sectorName) || null
}

const AREA_COORDINATES: Record<string, [number, number]> = {
  "Gara de Nord": [44.4475, 26.0750],
  "Politehnica": [44.4390, 26.0530],
  "AFI Cotroceni": [44.4280, 26.0600],
  "Herastrau": [44.4750, 26.0800],
  "Cismigiu": [44.4400, 26.0950],
  "Piata Unirii": [44.4250, 26.1050],
  "Piata Victoriei": [44.4500, 26.0900],
  "Calea Victoriei": [44.4475, 26.0975],
  "Bulevardul Magheru": [44.4450, 26.1000],
  "Lipscani": [44.4319, 26.1028],
  "Drumul Taberei": [44.4100, 26.0300],
  "Militari": [44.4200, 26.0200],
  "Berceni": [44.3800, 26.1200],
  "Pantelimon": [44.4000, 26.1300],
  "Titan": [44.4200, 26.1400],
  "Vitan": [44.4100, 26.1300],
  "Rahova": [44.4300, 26.0500],
  "Crangasi": [44.4400, 26.0400],
  "Giulesti": [44.4500, 26.0300],
  "Baneasa": [44.5100, 26.0800],
  "Otopeni": [44.5500, 26.0800],
}

// Component to auto-fit map bounds to show all markers
function FitBounds({ bounds }: { bounds: [number, number][] }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, bounds])
  
  return null
}

// Component to zoom to selected neighborhood (centers on it)
function ZoomToNeighborhood({ neighborhood, sectors }: { neighborhood: string | null, sectors: Sector[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (!neighborhood) return
    
    // Check if it's a sector - center on the sector center
    const sector = getSectorData(sectors, neighborhood)
    if (sector && sector.center) {
      const [lat, lng] = sector.center
      map.setView([lat, lng], 13, { animate: true })
    }
    // Check if it's an area - center on the area coordinates
    else if (AREA_COORDINATES[neighborhood]) {
      const [lat, lng] = AREA_COORDINATES[neighborhood]
      map.setView([lat, lng], 14, { animate: true })
    }
  }, [map, neighborhood, sectors])
  
  return null
}

// Create custom marker icon based on category and priority
const createMarkerIcon = (category: AlertCategory, priority: AlertPriority) => {
  const color = categoryMarkerColors[category]
  const emoji = categoryEmojis[category]
  const size = prioritySizes[priority]
  const fontSize = Math.max(12, size * 0.4) // Emoji size scales with marker size
  
  return new L.DivIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${fontSize}px;
        line-height: 1;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

interface AlertMapProps {
  alerts: Alert[]
  selectedNeighborhood?: string | null
}

export default function AlertMap({ alerts, selectedNeighborhood }: AlertMapProps) {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [sectorsLoading, setSectorsLoading] = useState(true)

  // Fetch sectors from backend on mount
  useEffect(() => {
    const loadSectors = async () => {
      try {
        const data = await fetchSectors()
        setSectors(data)
      } catch (err) {
        console.error('Failed to load sectors:', err)
        // Keep empty array on error - map will still work without sector polygons
        setSectors([])
      } finally {
        setSectorsLoading(false)
      }
    }
    loadSectors()
  }, [])

  // Filter alerts that have valid coordinates
  // For map view: show ALL alerts (don't filter by neighborhood - just zoom)
  const alertsWithCoords = alerts.filter(
    alert => alert.location.lat !== null && alert.location.lng !== null
  )

  // Default center (Bucharest)
  const defaultCenter: [number, number] = [44.4268, 26.1025]
  const defaultZoom = 12

  // Calculate bounds if we have alerts and no neighborhood is selected
  // If a neighborhood is selected, we'll zoom to it instead (but still show all alerts)
  const bounds = (!selectedNeighborhood && alertsWithCoords.length > 0)
    ? alertsWithCoords.map(alert => [alert.location.lat!, alert.location.lng!] as [number, number])
    : null

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
  }

  const categoryLabels: Record<AlertCategory, string> = {
    Road: '🚗 Road Incidents',
    Traffic: '🚦 Traffic',
    Safety: '⚠️ Safety',
    Emergency: '🚨 Emergency',
    Crime: '🔒 Crime',
    Lost: '🔍 Lost & Found',
    Weather: '🌧️ Weather',
    Environment: '🌍 Environment',
    Infrastructure: '⚡ Infrastructure',
    PublicTransport: '🚇 Public Transport',
    Construction: '🏗️ Construction',
    Event: '🎉 Events',
    General: '📢 General',
  }

  if (alertsWithCoords.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
        <p className="text-gray-500">No alerts with location data to display on map</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-300 shadow-lg">
      <MapContainer
        {...({ center: defaultCenter } as any)}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any)}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Render sector polygons as colored overlays from MongoDB */}
        {!sectorsLoading && sectors.length > 0 && sectors.map((sector) => {
          if (!sector.polygon || sector.polygon.length === 0) {
            return null
          }
          
          // Ensure polygon is closed (first and last point should be the same)
          const polygonPositions = sector.polygon.length > 0 && 
            sector.polygon[0][0] === sector.polygon[sector.polygon.length - 1][0] &&
            sector.polygon[0][1] === sector.polygon[sector.polygon.length - 1][1]
            ? sector.polygon
            : [...sector.polygon, sector.polygon[0]] // Close the polygon if not closed
          
          return (
            <Polygon
              key={sector.sector}
              positions={polygonPositions}
              pathOptions={{
                fillColor: SECTOR_COLORS[sector.sector] || "#6b7280",
                fillOpacity: 0.2,
                color: SECTOR_COLORS[sector.sector] || "#6b7280",
                weight: 2,
                opacity: 0.7,
              }}
            >
              <Tooltip>
                <div className="font-semibold text-sm">{sector.sector}</div>
              </Tooltip>
            </Polygon>
          )
        })}
        {selectedNeighborhood && <ZoomToNeighborhood neighborhood={selectedNeighborhood} sectors={sectors} />}
        {!selectedNeighborhood && bounds && <FitBounds bounds={bounds} />}
        {alertsWithCoords.map((alert) => {
          const icon = createMarkerIcon(alert.category, alert.priority)
          return (
            <Marker
              key={alert.id}
              position={[alert.location.lat!, alert.location.lng!]}
              {...({ icon } as any)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-1">{alert.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                      {categoryLabels[alert.category]}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                      {alert.priority}
                    </span>
                  </div>
                  {alert.description && (
                    <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                  )}
                  {alert.location.address && (
                    <p className="text-xs text-gray-500 mb-1">📍 {alert.location.address}</p>
                  )}
                  <p className="text-xs text-gray-400">{formatDate(alert.timestamp)}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
