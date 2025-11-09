import { useState, useEffect, useRef } from 'react'
import { createAlert, analyzeAlertText } from '../../services/citypulseApi'
import type { AlertAnalysisResult, AlertCategory, AlertPriority } from '../../types/citypulse'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuthGuard } from '../../hooks/useAuthGuard'
import { useAuth } from '../../contexts/AuthContext'

type InputMode = 'voice' | 'form' | 'text'

// TypeScript declarations for Speech Recognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}

// Map Location Selector Component
function MapLocationSelector({ onLocationSelect, initialLocation }: { onLocationSelect: (lat: number, lng: number) => void; initialLocation?: { lat: number; lng: number } | null }) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [44.4268, 26.1025] // Bucharest center
  )

  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        onLocationSelect(lat, lng)
      },
    })

    useEffect(() => {
      if (initialLocation) {
        map.setView([initialLocation.lat, initialLocation.lng], 13)
      }
    }, [initialLocation, map])

    return position ? (
      <Marker
        position={position}
        icon={new Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })}
      />
    ) : null
  }

  return (
    <MapContainer
      center={position || [44.4268, 26.1025]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker />
    </MapContainer>
  )
}

export default function AlertInput() {
  const { requireAuth } = useAuthGuard()
  const { user } = useAuth()
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [analysis, setAnalysis] = useState<AlertAnalysisResult | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapSelectedLocation, setMapSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showMapSelector, setShowMapSelector] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [allowContacting, setAllowContacting] = useState(false)
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioMode, setAudioMode] = useState<'record' | 'add'>('record')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General' as AlertCategory,
    priority: 'Medium' as AlertPriority,
    location: '',
    phone: '',
    email: '',
    other_contact: ''
  })

  // Auto-fill contact info when checkbox is checked
  useEffect(() => {
    if (allowContacting && user) {
      setFormData(prev => ({
        ...prev,
        phone: prev.phone || user.default_phone || '',
        email: prev.email || user.email || '',
        other_contact: prev.other_contact || user.default_other_contact || ''
      }))
    } else if (!allowContacting) {
      // Clear contact info when unchecked (only if it matches profile defaults)
      setFormData(prev => ({
        ...prev,
        phone: (user?.default_phone && prev.phone === user.default_phone) ? '' : prev.phone,
        email: (user?.email && prev.email === user.email) ? '' : prev.email,
        other_contact: (user?.default_other_contact && prev.other_contact === user.default_other_contact) ? '' : prev.other_contact
      }))
    }
  }, [allowContacting, user])

  // Function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }

    setGettingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationError(null)
        setGettingLocation(false)
        setMessage({ type: 'success', text: 'Location obtained successfully!' })
      },
      (error) => {
        setGettingLocation(false)
        let errorMsg = 'Failed to get location. '
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'Location permission denied. Please enable location sharing in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMsg += 'Location request timed out. Please try again.'
            break
          default:
            errorMsg += 'An unknown error occurred.'
            break
        }
        setLocationError(errorMsg)
        setMessage({ type: 'error', text: errorMsg })
      },
      {
        timeout: 10000,
        maximumAge: 60000, // Use cached location if available
        enableHighAccuracy: true,
      }
    )
  }

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript + ' '
            }
          }

          // Update text with both final and interim results for better UX
          const combinedTranscript = (transcript + finalTranscript + interimTranscript).trim()
          if (combinedTranscript) {
            setText(combinedTranscript)
          }

          // Only update transcript state with final results
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript)
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          if (event.error === 'no-speech') {
            setMessage({ type: 'error', text: 'No speech detected. Please try again.' })
          } else if (event.error === 'not-allowed') {
            setMessage({ type: 'error', text: 'Microphone permission denied. Please enable microphone access.' })
          }
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      if (audioMode === 'record') {
        // Start fresh recording
        setTranscript('')
        setText('')
      }
      // If 'add' mode, keep existing text and append
      setMessage(null)
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleAnalyze = async () => {
    let textToAnalyze = text.trim()
    
    // If form mode, construct text from form data
    if (inputMode === 'form') {
      textToAnalyze = `${formData.title}. ${formData.description}. Location: ${formData.location}. Category: ${formData.category}. Priority: ${formData.priority}.`
    }
    
    if (!textToAnalyze) return

    // Clear any previous error messages when starting analysis
    setMessage(null)
    setAnalyzing(true)
    try {
      // For voice input, always use AI to clean and structure the transcript
      const isSpeechInput = inputMode === 'voice'
      
      const result = await analyzeAlertText(
        textToAnalyze,
        userLocation?.lat,
        userLocation?.lng,
        isSpeechInput
      )
      
      // If form mode, merge form data with analysis
      if (inputMode === 'form') {
        result.title = formData.title || result.title
        result.description = formData.description || result.description
        result.category = formData.category
        result.priority = formData.priority
        result.phone = formData.phone || result.phone
        result.email = formData.email || result.email
        result.other_contact = formData.other_contact || result.other_contact
      }
      
      // Check if AI determined it's not a valid alert
      if (result.is_valid_alert === false) {
        setMessage({ 
          type: 'error', 
          text: `This input does not appear to be a valid alert. ${result.reason || 'Please provide information about an incident, issue, or event in Bucharest.'}` 
        })
        setAnalysis(null)
        setShowAnalysis(false)
        setAnalyzing(false)
        return
      }
      
      // If valid, ensure we have the required data
      if (!result.title || !result.category || !result.priority) {
        setMessage({ 
          type: 'error', 
          text: 'Analysis incomplete. Please try again or provide more details.' 
        })
        setAnalysis(null)
        setShowAnalysis(false)
        setAnalyzing(false)
        return
      }
      
      // Validate analysis before showing: must have title and location coordinates
      const hasTitle = result.title && result.title.trim().length > 0
      
      // Location is required - must have coordinates (lat/lng)
      const hasLocation = (
        (result.location && result.location.lat && result.location.lng) ||
        (mapSelectedLocation && mapSelectedLocation.lat && mapSelectedLocation.lng) ||
        (userLocation && userLocation.lat && userLocation.lng)
      )
      
      // If map location is selected, use it
      if (mapSelectedLocation && mapSelectedLocation.lat && mapSelectedLocation.lng) {
        result.location = {
          lat: mapSelectedLocation.lat,
          lng: mapSelectedLocation.lng,
          address: result.location?.address || null
        }
        // Update location_hierarchy with map-selected location
        if (!result.location_hierarchy) {
          result.location_hierarchy = {
            point: `${mapSelectedLocation.lat},${mapSelectedLocation.lng}`,
            area: null,
            sector: null,
            city: 'Bucharest'
          }
        } else {
          result.location_hierarchy.point = `${mapSelectedLocation.lat},${mapSelectedLocation.lng}`
        }
      }
      
      // If user location is available and no map location, use it
      if (!hasLocation && userLocation && userLocation.lat && userLocation.lng) {
        result.location = {
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: result.location?.address || null
        }
        if (!result.location_hierarchy) {
          result.location_hierarchy = {
            point: `${userLocation.lat},${userLocation.lng}`,
            area: null,
            sector: null,
            city: 'Bucharest'
          }
        } else {
          result.location_hierarchy.point = `${userLocation.lat},${userLocation.lng}`
        }
      }
      
      if (!hasTitle || !hasLocation) {
        let errorMsg = 'Analysis incomplete. '
        if (!hasTitle) {
          errorMsg += 'Title is missing. '
        }
        if (!hasLocation) {
          errorMsg += 'Location is required. Please: 1) Mention a location in your text (e.g., "Politehnica", "Herastrau Park", "Calea Victoriei"), 2) Click "Get Current Location", or 3) Select location on map.'
        }
        setMessage({ type: 'error', text: errorMsg })
        setAnalysis(null)
        setShowAnalysis(false)
        return
      }
      
      setAnalysis(result)
      setShowAnalysis(true)
    } catch (error: any) {
      let errorMessage = ''
      
      if (error instanceof Error) {
        // Use the error message directly (it should already contain the backend error detail)
        const errorMsg = error.message || ''
        
        if (error.name === 'AbortError' || errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          errorMessage = 'Request timed out. The AI service may be slow. Please try again.'
        } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('network')) {
          errorMessage = 'Network error: Cannot connect to the backend server. Please check your internet connection and ensure the backend server is running on port 8000.'
        } else {
          // Use the actual error message from backend (should already contain details)
          errorMessage = errorMsg || 'An unexpected error occurred. Please check the backend console/terminal for details.'
        }
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message) || 'An unexpected error occurred.'
      } else {
        errorMessage = 'An unexpected error occurred. Please check the backend console/terminal for details.'
      }
      
      setMessage({ type: 'error', text: errorMessage })
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasText = inputMode === 'text' || inputMode === 'voice' ? text.trim() : formData.title.trim()
    if (!hasText || !analysis) return

    // Require authentication for creating alerts
    requireAuth(async () => {
      await submitAlert()
    })
  }

  const submitAlert = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Use map-selected location, user location, or analysis location (in that priority order)
      const finalLocation = mapSelectedLocation || userLocation || analysis.location
      
      // Ensure location object has the correct structure (required field with coordinates)
      const location = {
        lat: finalLocation?.lat ?? null,
        lng: finalLocation?.lng ?? null,
        address: analysis.location?.address ?? null,
      }
      
      // Ensure location_hierarchy has the correct structure
      let location_hierarchy = analysis.location_hierarchy ? {
        point: analysis.location_hierarchy.point ?? null,
        area: analysis.location_hierarchy.area ?? null,
        sector: analysis.location_hierarchy.sector ?? null,
        city: analysis.location_hierarchy.city ?? null,
      } : {
        point: null,
        area: null,
        sector: null,
        city: null,
      }
      
      // If we have coordinates, update location_hierarchy point
      if (location.lat && location.lng) {
        location_hierarchy.point = `${location.lat},${location.lng}`
        if (!location_hierarchy.city) {
          location_hierarchy.city = 'Bucharest'
        }
      }

      // Validate required fields
      if (!analysis.title || analysis.title.trim().length === 0) {
        setMessage({ type: 'error', text: 'Title is required. Please ensure the analysis includes a valid title.' })
        setLoading(false)
        return
      }

      if (!analysis.category) {
        setMessage({ type: 'error', text: 'Category is required. Please ensure the analysis includes a valid category.' })
        setLoading(false)
        return
      }

      if (!analysis.priority) {
        setMessage({ type: 'error', text: 'Priority is required. Please ensure the analysis includes a valid priority.' })
        setLoading(false)
        return
      }

      // Location is REQUIRED - must have coordinates (finalLocation already declared above)
      if (!finalLocation || !finalLocation.lat || !finalLocation.lng) {
        setMessage({ type: 'error', text: 'Location is required. Please select a location on the map, get your current location, or mention a location in your text.' })
        setLoading(false)
        return
      }

      const alert = {
        title: analysis.title.trim(),
        description: analysis.description?.trim() || null,
        category: analysis.category,
        priority: analysis.priority,
        location: location,
        location_hierarchy: location_hierarchy,
        neighborhood: analysis.neighborhood || null,
        area_type: analysis.area_type || null,
        username: null,
        phone: allowContacting && user?.default_phone 
          ? user.default_phone 
          : (analysis.phone || formData.phone || null),
        email: allowContacting && user?.email 
          ? user.email 
          : (analysis.email || formData.email || null),
        other_contact: allowContacting && user?.default_other_contact 
          ? user.default_other_contact 
          : (analysis.other_contact || formData.other_contact || null),
      }

      await createAlert(alert)
      setText('')
      setFormData({
        title: '',
        description: '',
        category: 'General',
        priority: 'Medium',
        location: '',
        phone: '',
        email: '',
        other_contact: ''
      })
      setAllowContacting(false)
      setAnalysis(null)
      setShowAnalysis(false)
      setMessage({ type: 'success', text: 'Alert submitted successfully!' })
      
      // Refresh page after 1 second to show new alert
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      let errorMessage = 'Failed to submit alert. '
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage += 'Network error. Please check your internet connection and ensure the backend server is running.'
        } else if (error.message.includes('500')) {
          errorMessage += 'Server error. The backend may be experiencing issues. Please try again later.'
        } else if (error.message.includes('400')) {
          errorMessage += 'Invalid data. Please check your alert information and try again.'
        } else {
          errorMessage += error.message || 'An unexpected error occurred.'
        }
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage += String(error.message)
      } else {
        errorMessage += 'Please try again.'
      }
      
      setMessage({ type: 'error', text: errorMessage })
      console.error('Submit error:', error)
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

  const categoryOptions: AlertCategory[] = ['Road', 'Traffic', 'Safety', 'Emergency', 'Crime', 'Lost', 'Weather', 'Environment', 'Infrastructure', 'PublicTransport', 'Construction', 'Event', 'General']
  const priorityOptions: AlertPriority[] = ['Low', 'Medium', 'High', 'Critical']

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Report an Alert</h2>
      
      {/* Input Mode Toggle */}
      <div className="mb-4">
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setInputMode('text')
              setShowAnalysis(false)
              setAnalysis(null)
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              inputMode === 'text'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✍️ Text
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('voice')
              setShowAnalysis(false)
              setAnalysis(null)
              stopListening()
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              inputMode === 'voice'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎤 Voice
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('form')
              setShowAnalysis(false)
              setAnalysis(null)
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              inputMode === 'form'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Form
          </button>
        </div>
      </div>

      {inputMode === 'voice' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-3">
            {typeof window !== 'undefined' && (window.SpeechRecognition || (window as any).webkitSpeechRecognition)
              ? 'Click the microphone button to start recording. Speak clearly and describe your alert.'
              : 'Voice recognition is not supported in your browser. Please use Text or Form mode.'}
          </p>
          
          {/* Audio Mode Selection */}
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setAudioMode('record')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                audioMode === 'record'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🎙️ Record New
            </button>
            <button
              type="button"
              onClick={() => setAudioMode('add')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                audioMode === 'add'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              ➕ Add to Existing
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={!recognitionRef.current}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isListening
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
              }`}
            >
              {isListening ? '⏹️ Stop Recording' : '🎤 Start Recording'}
            </button>
            {isListening && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Listening...</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {inputMode === 'form' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                  setShowAnalysis(false)
                  setAnalysis(null)
                }}
                placeholder="Brief title for your alert"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  setShowAnalysis(false)
                  setAnalysis(null)
                }}
                placeholder="Detailed description of the alert"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value as AlertCategory })
                    setShowAnalysis(false)
                    setAnalysis(null)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => {
                    setFormData({ ...formData, priority: e.target.value as AlertPriority })
                    setShowAnalysis(false)
                    setAnalysis(null)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorityOptions.map((pri) => (
                    <option key={pri} value={pri}>{pri}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value })
                    setShowAnalysis(false)
                    setAnalysis(null)
                  }}
                  placeholder="e.g., Calea Victoriei near Magheru"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  title="Get your current location"
                >
                  {gettingLocation ? '📍 Getting...' : '📍 Get Location'}
                </button>
              </div>
              {locationError && (
                <p className="mt-1 text-xs text-red-600">{locationError}</p>
              )}
              {userLocation && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Location obtained: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              )}
            </div>
            
            {user && (
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowContacting}
                    onChange={(e) => setAllowContacting(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Allow contacting me (use contact info from profile)
                  </span>
                </label>
                {allowContacting && (
                  <p className="mt-1 text-xs text-gray-500 ml-6">
                    Your default contact information will be automatically added to this alert.
                  </p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={allowContacting && user?.default_phone}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={allowContacting && user?.email}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Contact
                </label>
                <input
                  type="text"
                  value={formData.other_contact}
                  onChange={(e) => setFormData({ ...formData, other_contact: e.target.value })}
                  placeholder="WhatsApp, Telegram, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={allowContacting && user?.default_other_contact}
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
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
              disabled={loading || analyzing || isListening}
            />
            <div className="mt-2 space-y-2">
              {!userLocation && text.trim().length < 30 && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-blue-600">💡</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">
                      <strong>Tip:</strong> You can mention a location in your text (e.g., "Politehnica", "Herastrau Park"), click below to share your current location, or select a location on the map.
                    </p>
                    <div className="mt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {gettingLocation ? '📍 Getting Location...' : '📍 Get Current Location'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMapSelector(!showMapSelector)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        {showMapSelector ? '🗺️ Hide Map' : '🗺️ Select on Map'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {locationError && (
                <p className="text-sm text-red-600">{locationError}</p>
              )}
              {userLocation && (
                <p className="text-sm text-green-600">
                  ✓ Location obtained: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              )}
              {mapSelectedLocation && (
                <p className="text-sm text-green-600">
                  ✓ Map location selected: {mapSelectedLocation.lat.toFixed(4)}, {mapSelectedLocation.lng.toFixed(4)}
                </p>
              )}
              {showMapSelector && (
                <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                  <MapLocationSelector
                    onLocationSelect={(lat, lng) => {
                      setMapSelectedLocation({ lat, lng })
                      setShowMapSelector(false)
                    }}
                    initialLocation={mapSelectedLocation || userLocation}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || (inputMode === 'text' && !text.trim()) || (inputMode === 'form' && !formData.title.trim()) || (inputMode === 'voice' && !text.trim()) || loading}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
          
          <button
            type="submit"
            disabled={loading || !analysis || (inputMode === 'text' && !text.trim()) || (inputMode === 'form' && !formData.title.trim()) || (inputMode === 'voice' && !text.trim())}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Alert'}
          </button>
          
          {message && (
            <div className={`px-4 py-2 rounded-lg flex items-center justify-between ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <span>{message.text}</span>
              <button
                type="button"
                onClick={() => setMessage(null)}
                className="ml-4 text-gray-600 hover:text-gray-800"
                aria-label="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Analysis Results - Show right after input section */}
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
            <div className="font-semibold text-gray-900">{analysis.title || 'N/A'}</div>
          </div>

          {(analysis.location_hierarchy || analysis.location || analysis.location_mentions) && (
            <div className="mb-4">
              <span className="text-sm text-gray-600">Location:</span>
              <div className="text-gray-900">
                {analysis.location_hierarchy && (
                  <>
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
                  </>
                )}
                {!analysis.location_hierarchy && analysis.location_mentions && analysis.location_mentions.length > 0 && (
                  <div className="text-blue-600 font-semibold">
                    📍 {analysis.location_mentions.join(', ')}
                  </div>
                )}
                {!analysis.location_hierarchy && !analysis.location_mentions && analysis.location && analysis.location.lat && analysis.location.lng && (
                  <div className="text-gray-700">
                    📍 Coordinates: {analysis.location.lat.toFixed(4)}, {analysis.location.lng.toFixed(4)}
                  </div>
                )}
              </div>
              {analysis.location && analysis.location.address && (
                <div className="text-xs text-gray-500 mt-1">
                  {analysis.location.address}
                </div>
              )}
            </div>
          )}

          {(analysis.phone || analysis.email || analysis.other_contact) && (
            <div className="mb-4">
              <span className="text-sm text-gray-600">Contact Information:</span>
              <div className="text-sm text-gray-700 mt-1 space-y-1">
                {analysis.phone && (
                  <p className="flex items-center gap-1">
                    📞 {analysis.phone}
                  </p>
                )}
                {analysis.email && (
                  <p className="flex items-center gap-1">
                    ✉️ {analysis.email}
                  </p>
                )}
                {analysis.other_contact && (
                  <p className="flex items-center gap-1">
                    💬 {analysis.other_contact}
                  </p>
                )}
              </div>
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
            onClick={() => {
              setShowAnalysis(false)
              setAnalysis(null)
            }}
            className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Hide Analysis
          </button>
        </div>
      )}
    </div>
  )
}
