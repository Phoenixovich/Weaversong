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
  const [showAnalysis, setShowAnalysis] = useState(false)
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
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
          // Location will be extracted from text mentions if available
        },
        {
          timeout: 5000,
          maximumAge: 60000, // Use cached location if available
        }
      )
    }
  }, [])

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
      setTranscript('')
      setText('')
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

    setAnalyzing(true)
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
              <input
                type="text"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value })
                  setShowAnalysis(false)
                  setAnalysis(null)
                }}
                placeholder="e.g., Calea Victoriei near Magheru"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
            {!userLocation && (
              <p className="mt-2 text-sm text-gray-500">
                💡 <strong>Tip:</strong> Since location access is disabled, please mention the location in your text (e.g., "Calea Victoriei", "Herastrau Park", "Sector 1"). The system will automatically detect and use it.
              </p>
            )}
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

