import { useEffect, useState } from 'react'
import type { Alert, AlertCategory, AlertPriority } from '../types'
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
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]) // All alerts for map view (no filters)
  const [alerts, setAlerts] = useState<Alert[]>([]) // Filtered alerts for list view
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)
  const [neighborhoods, setNeighborhoods] = useState<{ Sectors: string[]; Areas: string[]; City: string[] } | null>(null)
  const [areaSearchQuery, setAreaSearchQuery] = useState<string>('')
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false)

  useEffect(() => {
    loadNeighborhoods()
    loadAllAlerts() // Load all alerts for map view
    loadAlerts() // Load filtered alerts for list view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNeighborhood, selectedCategory, selectedPriority])

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

  const loadAllAlerts = async () => {
    // Load all alerts (no filters) for map view
    try {
      const data = await fetchAlerts(null, null)
      setAllAlerts(data)
    } catch (err) {
      console.error('Error loading all alerts:', err)
      setAllAlerts([])
    }
  }

  const loadAlerts = async () => {
    // Load filtered alerts for list view
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAlerts(selectedNeighborhood, selectedCategory, selectedPriority)
      setAlerts(data)
    } catch (err) {
      setError('Failed to load alerts. Make sure the backend is running.')
      console.error('Error loading alerts:', err)
      setAlerts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Get all neighborhoods as a flat list for searching
  const allNeighborhoods = neighborhoods ? [
    ...neighborhoods.Sectors.map(n => ({ name: n, type: 'Sector' })),
    ...neighborhoods.Areas.map(n => ({ name: n, type: 'Area' })),
    ...neighborhoods.City.map(n => ({ name: n, type: 'City' }))
  ] : []

  // Filter neighborhoods based on search query
  const filteredNeighborhoods = areaSearchQuery.trim() === ''
    ? []
    : allNeighborhoods.filter(n =>
        n.name.toLowerCase().includes(areaSearchQuery.toLowerCase())
      ).slice(0, 10) // Limit to 10 suggestions

  // Handle area selection from search
  const handleAreaSelect = (areaName: string) => {
    setSelectedNeighborhood(areaName || null)
    setAreaSearchQuery(areaName)
    setShowAreaSuggestions(false)
  }

  // Clear area search when dropdown is used
  const handleDropdownChange = (value: string) => {
    setSelectedNeighborhood(value || null)
    setAreaSearchQuery(value || '')
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Community Alerts</h2>
        
        <div className="flex gap-3 flex-wrap">
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
          
          {/* Area Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search area..."
              value={areaSearchQuery}
              onChange={(e) => {
                setAreaSearchQuery(e.target.value)
                setShowAreaSuggestions(true)
                if (e.target.value === '') {
                  setSelectedNeighborhood(null)
                }
              }}
              onFocus={() => setShowAreaSuggestions(true)}
              onBlur={() => {
                // Delay to allow click on suggestions
                setTimeout(() => setShowAreaSuggestions(false), 200)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
            />
            {showAreaSuggestions && filteredNeighborhoods.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div
                  className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedNeighborhood(null)
                    setAreaSearchQuery('')
                    setShowAreaSuggestions(false)
                  }}
                >
                  Clear filter
                </div>
                {filteredNeighborhoods.map((n) => (
                  <div
                    key={n.name}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleAreaSelect(n.name)}
                  >
                    <div className="font-medium text-gray-900">{n.name}</div>
                    <div className="text-xs text-gray-500">{n.type}</div>
                  </div>
                ))}
              </div>
            )}
            {showAreaSuggestions && areaSearchQuery.trim() !== '' && filteredNeighborhoods.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="px-4 py-2 text-sm text-gray-500">
                  No areas found matching "{areaSearchQuery}"
                </div>
              </div>
            )}
          </div>

          {/* Area Dropdown (Alternative) */}
          <select
            value={selectedNeighborhood || ''}
            onChange={(e) => handleDropdownChange(e.target.value)}
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
          
          <select
            value={selectedPriority || ''}
            onChange={(e) => setSelectedPriority(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            <option value="Critical">🔴 Critical</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>
      </div>
      
      {view === 'map' ? (
        allAlerts.length > 0 ? (
          <AlertMap alerts={allAlerts} selectedNeighborhood={selectedNeighborhood} />
        ) : (
          <div className="text-center py-8 text-gray-600">
            No alerts found. Be the first to report something!
          </div>
        )
      ) : (
        <>
          {alerts.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No alerts found. {selectedNeighborhood || selectedCategory || selectedPriority ? 'Try adjusting your filters.' : 'Be the first to report something!'}
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
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {categoryLabels[category]}
              <span className="text-sm font-normal text-gray-600">
                ({categoryAlerts.length})
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-lg p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-base mb-1 flex-1 line-clamp-2">{alert.title}</h4>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${
                      priorityColors[alert.priority] || priorityColors.Medium
                    }`}>
                      {alert.priority}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(alert.timestamp)}
                    </span>
                  </div>
                  
                  {alert.description && (
                    <p className="text-gray-700 text-sm mb-3 line-clamp-3 flex-grow">{alert.description}</p>
                  )}
                  
                  <div className="mt-auto space-y-2">
                    {alert.location_hierarchy && (
                      <div className="text-xs">
                        {alert.location_hierarchy.area && (
                          <p className="text-blue-600 font-medium truncate">
                            🏘️ {alert.location_hierarchy.area}
                          </p>
                        )}
                        {alert.location_hierarchy.sector && !alert.location_hierarchy.area && (
                          <p className="text-blue-700 font-medium truncate">
                            🏛️ {alert.location_hierarchy.sector}
                          </p>
                        )}
                        {alert.location_hierarchy.city && !alert.location_hierarchy.area && !alert.location_hierarchy.sector && (
                          <p className="text-gray-600 truncate">
                            🏙️ {alert.location_hierarchy.city}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {alert.location.address && (
                      <p className="text-xs text-gray-500 truncate" title={alert.location.address}>
                        📍 {alert.location.address}
                      </p>
                    )}
                    
                    {(alert.phone || alert.email || alert.other_contact) && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Contact:</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          {alert.phone && (
                            <p className="truncate">
                              📞 <a href={`tel:${alert.phone}`} className="text-blue-600 hover:underline">{alert.phone}</a>
                            </p>
                          )}
                          {alert.email && (
                            <p className="truncate">
                              ✉️ <a href={`mailto:${alert.email}`} className="text-blue-600 hover:underline truncate block">{alert.email}</a>
                            </p>
                          )}
                          {alert.other_contact && (
                            <p className="truncate">
                              💬 {alert.other_contact}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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


