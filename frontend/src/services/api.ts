import type { Alert, AlertCreateInput, AlertAnalysisResult } from '../types'

const API_BASE_URL = '/api'

export async function fetchAlerts(
  neighborhood?: string | null,
  category?: string | null
): Promise<Alert[]> {
  const params = new URLSearchParams()
  if (neighborhood) params.append('neighborhood', neighborhood)
  if (category) params.append('category', category)
  
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
  const response = await fetch(`${API_BASE_URL}/alerts/neighborhoods`, {
    signal: AbortSignal.timeout(10000) // 10 second timeout
  })
  if (!response.ok) {
    throw new Error('Failed to fetch neighborhoods')
  }
  return response.json()
}

export async function analyzeAlertText(
  text: string,
  userLat?: number | null,
  userLng?: number | null
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
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout for analysis
    })
    
    if (!response.ok) {
      let errorMessage = `Failed to analyze alert (${response.status}). `
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
          errorMessage += 'Invalid request. Please check your input.'
        } else if (response.status === 503) {
          errorMessage += 'Service unavailable. The AI service may be down.'
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

