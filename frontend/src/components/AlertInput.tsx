import { useState, useEffect, useRef } from 'react'
import { createAlert, analyzeAlertText } from '../services/api'
import type { AlertAnalysisResult, AlertCategory, AlertPriority } from '../types'

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

export default function AlertInput() {
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [analysis, setAnalysis] = useState<AlertAnalysisResult | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  
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

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            }
          }

          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript)
            setText(prev => prev + finalTranscript)
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

    // Check if location is needed - be more lenient, let backend handle detection
    // The backend will detect locations from the library, so we just check for common location keywords
    const locationKeywords = [
      'politehnica', 'upb', 'university', 'polytechnic',
      'afi', 'cotroceni', 'controceni',
      'herastrau', 'cismigiu', 'carol',
      'victoriei', 'magheru', 'unirii', 'lipscani',
      'gara', 'nord', 'station',
      'sector', 'sectorul',
      'calea', 'strada', 'bulevardul', 'piata', 'parcul',
      'carturesti', 'carusel',
      'drumul taberei', 'militari', 'berceni', 'pantelimon',
      'titan', 'vitan', 'rahova', 'crangasi', 'giulesti',
      'baneasa', 'otopeni'
    ]
    const textLower = textToAnalyze.toLowerCase()
    const hasLocationInText = locationKeywords.some(keyword => textLower.includes(keyword))
    
    // Don't block if location might be in text - let backend analyze it
    // Only require location if text is very short and clearly has no location
    if (!userLocation && !hasLocationInText && !formData.location && textToAnalyze.length < 20) {
      setMessage({ 
        type: 'error', 
        text: 'Location required: Please either mention a location in your text (e.g., "Calea Victoriei", "Herastrau Park", "Politehnica"), click "Get Current Location" button, or enter a location in the form field.' 
      })
      return
    }

    setAnalyzing(true)
    setMessage(null)
    try {
      const result = await analyzeAlertText(
        textToAnalyze,
        userLocation?.lat,
        userLocation?.lng
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
      
      // Validate analysis before showing: must have title and location
      const hasTitle = result.title && result.title.trim().length > 0
      const hasLocation = (
        (result.location_hierarchy && (
          result.location_hierarchy.area ||
          result.location_hierarchy.sector ||
          result.location_hierarchy.point ||
          result.location_hierarchy.city
        )) ||
        (result.location && (
          result.location.lat && result.location.lng
        )) ||
        (result.location_mentions && result.location_mentions.length > 0)
      )
      
      if (!hasTitle || !hasLocation) {
        let errorMsg = 'Analysis incomplete. '
        if (!hasTitle) {
          errorMsg += 'Title is missing. '
        }
        if (!hasLocation) {
          errorMsg += 'Location is missing. Please mention a location in your text (e.g., "Politehnica", "Herastrau Park", "Calea Victoriei") or click "Get Current Location".'
        }
        setMessage({ type: 'error', text: errorMsg })
        setAnalysis(null)
        setShowAnalysis(false)
        return
      }
      
      setAnalysis(result)
      setShowAnalysis(true)
    } catch (error: any) {
      let errorMessage = 'Failed to analyze text. '
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          errorMessage += 'Request timed out. The AI service may be slow. Please try again.'
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage += 'Network error. Please check your internet connection and ensure the backend server is running.'
        } else if (error.message.includes('500')) {
          errorMessage += 'Server error. The backend may be experiencing issues. Please try again later.'
        } else if (error.message.includes('400')) {
          errorMessage += 'Invalid request. Please check your input and try again.'
        } else {
          errorMessage += error.message || 'An unexpected error occurred.'
        }
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage += String(error.message)
      } else {
        errorMessage += 'Please try again.'
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
              {!userLocation && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-yellow-600">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <strong>Location needed:</strong> Please either mention a location in your text (e.g., "Calea Victoriei", "Herastrau Park", "Sector 1") or click the "Get Location" button below to enable location sharing.
                    </p>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {gettingLocation ? '📍 Getting Location...' : '📍 Get Current Location'}
                    </button>
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

