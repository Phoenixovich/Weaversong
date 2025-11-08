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
    signal: AbortSignal.timeout(15000) // 15 second timeout for analysis
  })
  if (!response.ok) {
    throw new Error('Failed to analyze alert')
  }
  return response.json()
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
    throw new Error('Failed to create alert')
  }
  return response.json()
}

