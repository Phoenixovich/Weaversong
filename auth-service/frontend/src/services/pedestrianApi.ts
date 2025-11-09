const API_BASE_URL = '/pedestrian';

export interface PedestrianData {
  lat: number;
  lng: number;
  timestamp?: number;
}

export interface PedestrianAnalytics {
  location_name: string | null;
  lat: number;
  lng: number;
  total_count: number;
  hourly_stats: { [hour: string]: number };
  daily_stats: { [day: string]: number };
  peak_hours: number[];
  average_per_hour: number;
  business_suggestions: string[];
}

export interface PopularLocation {
  lat: number;
  lng: number;
  location_name: string | null;
  count: number;
}

/**
 * Record pedestrian data (anonymous, no user ID)
 * This is called when user enters the site (with permission)
 */
export async function recordPedestrianData(data: PedestrianData): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to record pedestrian data');
    }
  } catch (error) {
    console.error('Failed to record pedestrian data:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Get pedestrian analytics (requires premium or admin)
 */
export async function getPedestrianAnalytics(params?: {
  location_name?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  start_date?: string;
  end_date?: string;
  timeframe?: string;
}): Promise<PedestrianAnalytics[]> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/analytics?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('This feature requires premium subscription or admin role');
    }
    throw new Error('Failed to fetch analytics');
  }

  return response.json();
}

/**
 * Get popular locations (requires premium or admin)
 */
export async function getPopularLocations(
  limit: number = 10,
  start_date?: string,
  end_date?: string,
  timeframe?: string
): Promise<PopularLocation[]> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const queryParams = new URLSearchParams();
  queryParams.append('limit', limit.toString());
  if (start_date) queryParams.append('start_date', start_date);
  if (end_date) queryParams.append('end_date', end_date);
  if (timeframe) queryParams.append('timeframe', timeframe);

  const response = await fetch(`${API_BASE_URL}/popular-locations?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('This feature requires premium subscription or admin role');
    }
    throw new Error('Failed to fetch popular locations');
  }

  return response.json();
}


