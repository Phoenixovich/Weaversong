import { useState, useEffect } from 'react'
import { createAlert, analyzeAlertText } from '../services/api'
import type { AlertAnalysisResult } from '../types'

export default function AlertInput() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [analysis, setAnalysis] = useState<AlertAnalysisResult | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  // Get user location on mount (with timeout)
  useEffect(() => {
    if (navigator.geolocation) {
      const timeoutId = setTimeout(() => {
        // Timeout after 5 seconds - don't block the UI
      }, 5000)
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId)
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          clearTimeout(timeoutId)
          // User denied or error getting location - that's okay
        },
        {
          timeout: 5000,
          maximumAge: 60000, // Use cached location if available
        }
      )
    }
  }, [])

  const handleAnalyze = async () => {
    if (!text.trim()) return

    setAnalyzing(true)
    try {
      const result = await analyzeAlertText(
        text,
        userLocation?.lat,
        userLocation?.lng
      )
      setAnalysis(result)
      setShowAnalysis(true)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to analyze text. Please try again.' })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !analysis) return

    setLoading(true)
    setMessage(null)

    try {
      const alert = {
        title: analysis.title,
        description: analysis.description,
        category: analysis.category,
        priority: analysis.priority,
        location: analysis.location,
        location_hierarchy: analysis.location_hierarchy,
        neighborhood: analysis.neighborhood,
        area_type: analysis.area_type,
        username: null,
        phone: analysis.phone || null,
        email: analysis.email || null,
        other_contact: analysis.other_contact || null,
      }

      await createAlert(alert)
      setText('')
      setAnalysis(null)
      setShowAnalysis(false)
      setMessage({ type: 'success', text: 'Alert submitted successfully!' })
      
      // Refresh page after 1 second to show new alert
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit alert. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const priorityColors = {
    Critical: 'bg-red-100 text-red-800 border-red-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Low: 'bg-green-100 text-green-800 border-green-300',
  }

  const categoryEmojis = {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Report an Alert</h2>
      <p className="text-gray-600 mb-4">
        Simply type what happened. AI will analyze and structure your alert automatically.
      </p>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setShowAnalysis(false)
            setAnalysis(null)
          }}
          placeholder="Type your alert here... (e.g., 'URGENT: Traffic accident on Calea Victoriei near Magheru', 'Lost golden retriever near Herastrau Park', 'Heavy rain expected in city center')"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
          disabled={loading || analyzing}
        />
        
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !text.trim() || loading}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Text'}
          </button>
          
          <button
            type="submit"
            disabled={loading || !text.trim() || !analysis}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Alert'}
          </button>
          
          {message && (
            <div className={`px-4 py-2 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </form>

      {showAnalysis && analysis && (
        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Analysis Results:</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-600">Category:</span>
              <div className="font-semibold text-gray-900">
                {categoryEmojis[analysis.category]} {analysis.category}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Priority:</span>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border-2 ${
                priorityColors[analysis.priority]
              }`}>
                {analysis.priority}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-sm text-gray-600">Title:</span>
            <div className="font-semibold text-gray-900">{analysis.title}</div>
          </div>

          {analysis.location_hierarchy && (
            <div className="mb-4">
              <span className="text-sm text-gray-600">Location:</span>
              <div className="text-gray-900">
                {analysis.location_hierarchy.point && (
                  <div className="text-xs text-gray-500 mb-1">
                    📍 Point: {analysis.location_hierarchy.point}
                  </div>
                )}
                {analysis.location_hierarchy.area && (
                  <div className="text-blue-600 font-semibold">
                    🏘️ Area: {analysis.location_hierarchy.area}
                  </div>
                )}
                {analysis.location_hierarchy.sector && (
                  <div className="text-blue-700 font-semibold">
                    🏛️ Sector: {analysis.location_hierarchy.sector}
                  </div>
                )}
                {analysis.location_hierarchy.city && (
                  <div className="text-gray-700">
                    🏙️ City: {analysis.location_hierarchy.city}
                  </div>
                )}
              </div>
              {analysis.location.address && (
                <div className="text-xs text-gray-500 mt-1">
                  {analysis.location.address}
                </div>
              )}
            </div>
          )}

          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div className="mb-4">
              <span className="text-sm text-gray-600">Suggestions:</span>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                {analysis.suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAnalysis(false)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Hide analysis
          </button>
        </div>
      )}
    </div>
  )
}

