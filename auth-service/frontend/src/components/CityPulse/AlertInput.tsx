import { useState, useEffect, useRef } from 'react'
import { createAlert, analyzeAlertText } from '../../services/citypulseApi'
import type { AlertAnalysisResult, AlertCategory, AlertPriority } from '../../types/citypulse'

type InputMode = 'voice' | 'form' | 'text'

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

  // Simplified: no speech recognition implementation for now

  const handleAnalyze = async () => {
    let textToAnalyze = text.trim()
    if (!textToAnalyze) return
    setMessage(null)
    setAnalyzing(true)
    try {
      const isSpeechInput = inputMode === 'voice'
      const result = await analyzeAlertText(textToAnalyze, userLocation?.lat, userLocation?.lng, isSpeechInput)
      setAnalysis(result)
      setShowAnalysis(true)
    } catch (error: any) {
      setMessage({ type: 'error', text: String(error.message || error) })
      setAnalysis(null)
      setShowAnalysis(false)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!analysis) return
    setLoading(true)
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
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: String(error.message || error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="citypulse-input">
      <h2>Report an Incident</h2>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full p-2 border" />
      <div className="mt-2">
        <button onClick={handleAnalyze} disabled={analyzing} className="btn">
          {analyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {showAnalysis && analysis && (
        <div className="analysis mt-2 p-2 border">
          <h3>Analysis</h3>
          <div><strong>Title:</strong> {analysis.title}</div>
          <div><strong>Category:</strong> {analysis.category}</div>
          <div><strong>Priority:</strong> {analysis.priority}</div>
          <div><strong>Location:</strong> {analysis.location_hierarchy?.area || analysis.location_mentions?.[0] || 'Unknown'}</div>
          <div className="mt-2">
            <button onClick={handleSubmit} className="btn-primary">Submit Alert</button>
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-2 p-2 ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>{message.text}</div>
      )}
    </div>
  )
}
