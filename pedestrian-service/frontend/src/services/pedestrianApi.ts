import api from './api';

export interface PedestrianLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  device_info?: {
    type?: string;
    os?: string;
    browser?: string;
  };
  session_id?: string;
  is_active?: boolean;
}

export interface LocationAnalysisRequest {
  start_date?: string;
  end_date?: string;
  bounding_box?: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
  };
  analysis_type?: 'comprehensive' | 'business_spots' | 'dead_areas' | 'dangerous_areas';
}

export interface LocationAnalysisResult {
  analysis_type: string;
  timestamp: string;
  total_locations: number;
  unique_users: number;
  time_period: {
    start: string | null;
    end: string | null;
  };
  insights: {
    ai_analysis: string;
    statistics: any;
  };
  business_opportunities?: any[];
  areas_of_interest?: any[];
  dead_areas?: any[];
  dangerous_areas?: any[];
  heatmap_data?: Array<{
    latitude: number;
    longitude: number;
    intensity: number;
    avg_speed?: number;
    time_distribution?: any;
  }>;
}

// Generate a session ID for tracking user sessions
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get device information
export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  let os = 'unknown';
  let browser = 'unknown';

  // Detect device type
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  }

  // Detect OS
  if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/mac/i.test(ua)) {
    os = 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Detect browser
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/edge/i.test(ua)) {
    browser = 'Edge';
  }

  return {
    type: deviceType,
    os,
    browser
  };
};

// Collect a single location
export const collectLocation = async (location: PedestrianLocation): Promise<any> => {
  const response = await api.post('/pedestrian/location', location);
  return response.data;
};

// Collect multiple locations in batch
export const collectLocationsBatch = async (locations: PedestrianLocation[]): Promise<any> => {
  const response = await api.post('/pedestrian/locations/batch', locations);
  return response.data;
};

// Get locations with filters
export const getLocations = async (params?: {
  user_id?: string;
  session_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<PedestrianLocation[]> => {
  const response = await api.get('/pedestrian/locations', { params });
  return response.data;
};

// Analyze locations
export const analyzeLocations = async (request: LocationAnalysisRequest): Promise<LocationAnalysisResult> => {
  const response = await api.post('/pedestrian/analyze', request);
  return response.data;
};

// Get statistics
export const getStatistics = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<any> => {
  const response = await api.get('/pedestrian/stats', { params });
  return response.data;
};

// Delete a location
export const deleteLocation = async (locationId: string): Promise<any> => {
  const response = await api.delete(`/pedestrian/locations/${locationId}`);
  return response.data;
};

// Geolocation tracking utility
export class GeolocationTracker {
  private sessionId: string;
  private watchId: number | null = null;
  private collectionInterval: number = 30000; // 30 seconds default
  private onLocationUpdate?: (location: PedestrianLocation) => void;
  private onError?: (error: GeolocationPositionError) => void;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || generateSessionId();
  }

  startTracking(
    options?: {
      interval?: number;
      onLocationUpdate?: (location: PedestrianLocation) => void;
      onError?: (error: GeolocationPositionError) => void;
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      if (options?.interval) {
        this.collectionInterval = options.interval;
      }
      if (options?.onLocationUpdate) {
        this.onLocationUpdate = options.onLocationUpdate;
      }
      if (options?.onError) {
        this.onError = options.onError;
      }

      const geoOptions: PositionOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 0
      };

      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.handlePosition(position);
          resolve();
        },
        (error) => {
          if (this.onError) {
            this.onError(error);
          }
          reject(error);
        },
        geoOptions
      );

      // Watch position changes
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handlePosition(position);
        },
        (error) => {
          if (this.onError) {
            this.onError(error);
          }
        },
        geoOptions
      );
    });
  }

  private handlePosition(position: GeolocationPosition): void {
    const location: PedestrianLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed ?? undefined,
      heading: position.coords.heading ?? undefined,
      device_info: getDeviceInfo(),
      session_id: this.sessionId,
      is_active: true
    };

    if (this.onLocationUpdate) {
      this.onLocationUpdate(location);
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }
}


