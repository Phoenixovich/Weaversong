import { useEffect, useState } from 'react'
import type { Alert, AlertCategory } from '../types'
import { fetchAlerts, fetchNeighborhoods } from '../services/api'
import AlertMap from './AlertMap'

interface AlertListProps {
  view: 'list' | 'map'
  onViewChange: (view: 'list' | 'map') => void
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

const categoryColors: Record<AlertCategory, string> = {
  Road: 'bg-red-50 border-red-200',
  Traffic: 'bg-orange-50 border-orange-200',
  Safety: 'bg-yellow-50 border-yellow-200',
  Emergency: 'bg-red-100 border-red-300',
  Crime: 'bg-purple-50 border-purple-200',
  Lost: 'bg-blue-50 border-blue-200',
  Weather: 'bg-cyan-50 border-cyan-200',
  Environment: 'bg-green-50 border-green-200',
  Infrastructure: 'bg-indigo-50 border-indigo-200',
  PublicTransport: 'bg-pink-50 border-pink-200',
  Construction: 'bg-amber-50 border-amber-200',
  Event: 'bg-violet-50 border-violet-200',
  General: 'bg-gray-50 border-gray-200',
}

const priorityColors: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-300',
  High: 'bg-orange-100 text-orange-800 border-orange-300',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Low: 'bg-green-100 text-green-800 border-green-300',
}

export default function AlertList({ view, onViewChange }: AlertListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [neighborhoods, setNeighborhoods] = useState<{ Sectors: string[]; Areas: string[]; City: string[] } | null>(null)

  useEffect(() => {
    loadNeighborhoods()
    loadAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNeighborhood, selectedCategory])

  const loadNeighborhoods = async () => {
    try {
      const data = await fetchNeighborhoods()
      setNeighborhoods(data)
    } catch (err) {
      console.error('Failed to load neighborhoods', err)
      // Set default neighborhoods if API fails
      setNeighborhoods({
        Sectors: ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"],
        Areas: ["Gara de Nord", "Politehnica", "AFI Cotroceni", "Herastrau", "Cismigiu", "Piata Unirii", "Piata Victoriei", "Calea Victoriei", "Bulevardul Magheru", "Lipscani"],
        City: ["Bucharest"]
      })
    }
  }

  const loadAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAlerts(selectedNeighborhood, selectedCategory)
      setAlerts(data)
    } catch (err) {
      setError('Failed to load alerts. Make sure the backend is running.')
      console.error('Error loading alerts:', err)
      setAlerts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Group alerts by category
  const groupedAlerts = alerts.reduce((acc, alert) => {
    if (!acc[alert.category]) {
      acc[alert.category] = []
    }
    acc[alert.category].push(alert)
    return acc
  }, {} as Record<AlertCategory, Alert[]>)

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">Loading alerts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
        <button
          onClick={loadAlerts}
          className="ml-4 text-red-600 underline hover:text-red-800"
        >
          Retry
        </button>
      </div>
    )
  }

  const categoryOrder: AlertCategory[] = [
    'Emergency', 
    'Crime', 
    'Road', 
    'Traffic', 
    'Safety', 
    'Weather', 
    'Environment', 
    'Infrastructure', 
    'PublicTransport', 
    'Construction', 
    'Lost', 
    'Event', 
    'General'
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Community Alerts</h2>
        
        <div className="flex gap-3">
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewChange('list')}
              className={`px-4 py-2 rounded-md transition-colors ${
                view === 'list'
                  ? 'bg-white text-blue-600 shadow-sm font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => onViewChange('map')}
              className={`px-4 py-2 rounded-md transition-colors ${
                view === 'map'
                  ? 'bg-white text-blue-600 shadow-sm font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🗺️ Map
            </button>
          </div>
          
          <select
            value={selectedNeighborhood || ''}
            onChange={(e) => setSelectedNeighborhood(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Areas</option>
            {neighborhoods && (
              <>
                <optgroup label="Sectors">
                  {neighborhoods.Sectors.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </optgroup>
                <optgroup label="Areas">
                  {neighborhoods.Areas.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </optgroup>
                <optgroup label="City">
                  {neighborhoods.City.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
          
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categoryOrder.map((cat) => (
              <option key={cat} value={cat}>{categoryLabels[cat]}</option>
            ))}
          </select>
        </div>
      </div>
      
      {view === 'map' ? (
        alerts.length > 0 ? (
          <AlertMap alerts={alerts} selectedNeighborhood={selectedNeighborhood} />
        ) : (
          <div className="text-center py-8 text-gray-600">
            No alerts found. {selectedNeighborhood || selectedCategory ? 'Try adjusting your filters.' : 'Be the first to report something!'}
          </div>
        )
      ) : (
        <>
          {alerts.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No alerts found. {selectedNeighborhood || selectedCategory ? 'Try adjusting your filters.' : 'Be the first to report something!'}
            </div>
          )}
      
      {categoryOrder.map((category) => {
        const categoryAlerts = groupedAlerts[category] || []
        if (categoryAlerts.length === 0) return null

        return (
          <div
            key={category}
            className={`rounded-lg border-2 p-4 ${categoryColors[category]}`}
          >
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              {categoryLabels[category]}
              <span className="text-sm font-normal text-gray-600">
                ({categoryAlerts.length})
              </span>
            </h3>
            
            <div className="space-y-3">
              {categoryAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${
                          priorityColors[alert.priority] || priorityColors.Medium
                        }`}>
                          {alert.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(alert.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {alert.description && (
                    <p className="text-gray-700 text-sm mb-2">{alert.description}</p>
                  )}
                  
                  {alert.location_hierarchy && (
                    <div className="text-xs mb-1">
                      {alert.location_hierarchy.point && (
                        <p className="text-gray-400 mb-1">
                          📍 Point: {alert.location_hierarchy.point}
                        </p>
                      )}
                      {alert.location_hierarchy.area && (
                        <p className="text-blue-600 font-medium">
                          🏘️ {alert.location_hierarchy.area}
                        </p>
                      )}
                      {alert.location_hierarchy.sector && (
                        <p className="text-blue-700 font-medium">
                          🏛️ {alert.location_hierarchy.sector}
                        </p>
                      )}
                      {alert.location_hierarchy.city && (
                        <p className="text-gray-600">
                          🏙️ {alert.location_hierarchy.city}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {alert.location.address && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      {alert.location.address}
                    </p>
                  )}
                  
                  {(alert.phone || alert.email || alert.other_contact) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Contact Information:</p>
                      <div className="text-xs text-gray-600 space-y-1">
                        {alert.phone && (
                          <p className="flex items-center gap-1">
                            📞 <a href={`tel:${alert.phone}`} className="text-blue-600 hover:underline">{alert.phone}</a>
                          </p>
                        )}
                        {alert.email && (
                          <p className="flex items-center gap-1">
                            ✉️ <a href={`mailto:${alert.email}`} className="text-blue-600 hover:underline">{alert.email}</a>
                          </p>
                        )}
                        {alert.other_contact && (
                          <p className="flex items-center gap-1">
                            💬 {alert.other_contact}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
        </>
      )}
    </div>
  )
}


