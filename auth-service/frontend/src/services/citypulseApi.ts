import type { Alert, AlertCreateInput, AlertAnalysisResult } from '../types/citypulse'

const API_BASE_URL = '/citypulse'

export async function fetchAlerts(
  neighborhood?: string | null,
  category?: string | null,
  priority?: string | null
): Promise<Alert[]> {
  const params = new URLSearchParams()
  if (neighborhood) params.append('neighborhood', neighborhood)
  if (category) params.append('category', category)
  if (priority) params.append('priority', priority)
  
  const url = `${API_BASE_URL}/alerts${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000) // 10 second timeout
  })
  if (!response.ok) {
    throw new Error('Failed to fetch alerts')
  }
  return response.json()
}

export async function fetchNeighborhoods(): Promise<{ Sectors: string[]; Areas: string[]; City: string[] }> {
  // The backend exposes sectors/areas at /citypulse/sectors
  const response = await fetch(`${API_BASE_URL.replace('/alerts','')}/sectors`, {
    signal: AbortSignal.timeout(10000) // 10 second timeout
  })
  if (!response.ok) {
    throw new Error('Failed to fetch neighborhoods')
  }
  const data = await response.json()
  // Normalize backend shape { sectors: string[], areas: string[] } to the frontend's expected shape
  return {
    Sectors: data.sectors || [],
    Areas: data.areas || [],
    City: ['Bucharest']
  }
}

export async function analyzeAlertText(
  text: string,
  userLat?: number | null,
  userLng?: number | null,
  isSpeech?: boolean
): Promise<AlertAnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        user_lat: userLat,
        user_lng: userLng,
        is_speech: isSpeech || false,
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout for analysis
    })
    
    if (!response.ok) {
      let errorMessage = ''
      try {
        const errorData = await response.json()
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
            const firstError = errorData.detail[0]
            if (typeof firstError === 'object' && firstError.msg) {
              errorMessage = firstError.msg
            } else if (typeof firstError === 'string') {
              errorMessage = firstError
            } else {
              errorMessage = JSON.stringify(firstError)
            }
          } else if (typeof errorData.detail === 'object') {
            errorMessage = JSON.stringify(errorData.detail)
          }
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
        if (!errorMessage) {
          if (response.status === 500) {
            errorMessage = 'Server error (500). Check backend console/terminal for details.'
          } else if (response.status === 400) {
            errorMessage = 'Invalid request (400). Please check your input.'
          } else if (response.status === 503) {
            errorMessage = 'Service unavailable (503). The AI service may be down or API keys are missing.'
          } else if (response.status === 404) {
            errorMessage = 'Endpoint not found (404). The backend route may be missing.'
          } else {
            errorMessage = `HTTP ${response.status} error occurred.`
          }
        }
      } catch (parseError) {
        if (response.status === 500) {
          errorMessage = 'Server error (500). Check backend console/terminal for details. Common issues: MongoDB connection failed, API keys missing, or backend crashed.'
        } else if (response.status === 400) {
          errorMessage = 'Invalid request (400). Please check your input.'
        } else if (response.status === 503) {
          errorMessage = 'Service unavailable (503). The AI service may be down or API keys are missing.'
        } else if (response.status === 404) {
          errorMessage = 'Endpoint not found (404). The backend route may be missing.'
        } else {
          errorMessage = `HTTP ${response.status} error occurred.`
        }
      }
      const error = new Error(errorMessage)
      ;(error as any).status = response.status
      throw error
    }
    return response.json()
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('Request timed out. The AI service may be slow. Please try again.')
    }
    throw error
  }
}

export async function createAlert(alert: AlertCreateInput): Promise<Alert> {
  const response = await fetch(`${API_BASE_URL}/alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(alert),
  })
  
  if (!response.ok) {
    let errorMessage = `Failed to create alert (${response.status}). `
    try {
      const errorData = await response.json()
      if (errorData.detail) {
        errorMessage += errorData.detail
      } else if (errorData.message) {
        errorMessage += errorData.message
      }
    } catch {
      if (response.status === 500) {
        errorMessage += 'Server error. The backend may be experiencing issues.'
      } else if (response.status === 400) {
        errorMessage += 'Invalid data. Please check your alert information.'
      }
    }
    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    throw error
  }
  return response.json()
}

export interface Sector {
  sector: string
  type: string
  polygon: [number, number][]  // [lat, lng] pairs for Leaflet
  center: [number, number] | null  // [lat, lng] for Leaflet
  metadata: {
    source?: string
    coordinate_count?: number
  }
}

export async function fetchSectors(): Promise<Sector[]> {
  const response = await fetch(`${API_BASE_URL}/sectors`, {
    signal: AbortSignal.timeout(10000) // 10 second timeout
  })
  if (!response.ok) {
    throw new Error('Failed to fetch sectors')
  }
  return response.json()
}
