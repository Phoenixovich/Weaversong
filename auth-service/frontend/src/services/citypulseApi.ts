import type { Alert, AlertCreateInput, AlertAnalysisResult } from '../types/citypulse'

const API_BASE_URL = '/citypulse'

export async function fetchAlerts(
  neighborhood?: string[] | string | null,
  category?: string[] | string | null,
  priority?: string[] | string | null,
  dateFilter?: string | null
): Promise<Alert[]> {
  const params = new URLSearchParams()
  
  // Handle arrays or single values for multiple selections
  if (neighborhood) {
    if (Array.isArray(neighborhood)) {
      neighborhood.forEach(n => params.append('neighborhood', n))
    } else {
      params.append('neighborhood', neighborhood)
    }
  }
  if (category) {
    if (Array.isArray(category)) {
      category.forEach(c => params.append('category', c))
    } else {
      params.append('category', category)
    }
  }
  if (priority) {
    if (Array.isArray(priority)) {
      priority.forEach(p => params.append('priority', p))
    } else {
      params.append('priority', priority)
    }
  }
  if (dateFilter) params.append('date_filter', dateFilter)
  
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
  // The backend exposes sectors/areas at /citypulse/sectors/neighborhoods for filter dropdowns
  const response = await fetch(`${API_BASE_URL}/sectors/neighborhoods`, {
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
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(alert),
  })
  
  if (!response.ok) {
    let errorMessage = `Failed to create alert (${response.status}). `
    try {
      const errorData = await response.json()
      
      // Handle FastAPI validation errors (422)
      if (response.status === 422 && errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Pydantic validation errors come as an array
          const validationErrors = errorData.detail.map((err: any) => {
            const field = err.loc ? err.loc.join('.') : 'field'
            const msg = err.msg || 'Invalid value'
            return `${field}: ${msg}`
          }).join('; ')
          errorMessage += `Validation errors: ${validationErrors}`
        } else if (typeof errorData.detail === 'string') {
          errorMessage += errorData.detail
        } else {
          errorMessage += JSON.stringify(errorData.detail)
        }
      } else if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage += errorData.detail
        } else if (Array.isArray(errorData.detail)) {
          errorMessage += errorData.detail.map((e: any) => 
            typeof e === 'string' ? e : JSON.stringify(e)
          ).join('; ')
        } else {
          errorMessage += JSON.stringify(errorData.detail)
        }
      } else if (errorData.message) {
        errorMessage += errorData.message
      } else {
        errorMessage += JSON.stringify(errorData)
      }
    } catch (parseError) {
      if (response.status === 500) {
        errorMessage += 'Server error. The backend may be experiencing issues.'
      } else if (response.status === 400) {
        errorMessage += 'Invalid data. Please check your alert information.'
      } else if (response.status === 422) {
        errorMessage += 'Validation error. Please check all required fields are filled correctly.'
      }
    }
    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    throw error
  }
  return response.json()
}

export async function updateAlert(alertId: string, updateData: Partial<Alert>): Promise<Alert> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Authentication required to edit alerts');
  }

  const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    let errorMessage = `Failed to update alert (${response.status}). `;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage += errorData.detail;
      } else if (errorData.message) {
        errorMessage += errorData.message;
      }
    } catch {
      if (response.status === 403) {
        errorMessage += 'You do not have permission to edit this alert.';
      } else if (response.status === 401) {
        errorMessage += 'Please log in to edit alerts.';
      }
    }
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

export async function deleteAlert(alertId: string): Promise<void> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Authentication required to delete alerts');
  }

  const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to delete alert (${response.status}). `;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage += errorData.detail;
      } else if (errorData.message) {
        errorMessage += errorData.message;
      }
    } catch {
      if (response.status === 403) {
        errorMessage += 'You do not have permission to delete this alert.';
      } else if (response.status === 401) {
        errorMessage += 'Please log in to delete alerts.';
      }
    }
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }
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
