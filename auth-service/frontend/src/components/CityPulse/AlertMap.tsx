import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Alert } from '../../types/citypulse'
import * as L from 'leaflet'

// Fix default marker icon paths for Leaflet (works in many bundlers/Vite)
try {
  delete (L as any).Icon.Default.prototype._getIconUrl
} catch (e) {
  // ignore
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

export default function AlertMap({ alerts, selectedNeighborhood }: { alerts: Alert[]; selectedNeighborhood?: string | null }) {
  const firstWithCoords = alerts.find((a) => a.location && a.location.lat && a.location.lng)
  const center: [number, number] = firstWithCoords && firstWithCoords.location.lat && firstWithCoords.location.lng
    ? [firstWithCoords.location.lat as number, firstWithCoords.location.lng as number]
    : [44.4325, 26.1039]

  const filtered = selectedNeighborhood ? alerts.filter(a => a.neighborhood === selectedNeighborhood || (a.location_hierarchy && (a.location_hierarchy.area === selectedNeighborhood || a.location_hierarchy.sector === selectedNeighborhood))) : alerts

  return (
    <div className="citypulse-map" style={{ height: '500px' }}>
      <MapContainer {...({ center, zoom: 13 } as any)} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {filtered.map((a) => (
          a.location && a.location.lat && a.location.lng ? (
            <Marker key={a.id} position={[a.location.lat as number, a.location.lng as number]}>
              <Popup>
                <div className="max-w-xs">
                  <strong>{a.title}</strong>
                  <div className="text-sm text-gray-700">{a.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{a.location.address}</div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  )
}
