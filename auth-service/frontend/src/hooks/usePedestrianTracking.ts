import { useEffect, useState } from 'react';

/**
 * Hook to track pedestrian data when user enters the site
 * Only tracks if user gives permission and location is available
 */
export const usePedestrianTracking = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Check if user has previously given permission
    const storedPermission = localStorage.getItem('pedestrian_tracking_permission');
    if (storedPermission === 'granted') {
      setHasPermission(true);
      startTracking();
    } else if (storedPermission === 'denied') {
      setHasPermission(false);
    } else {
      // Ask for permission on first visit
      askForPermission();
    }
  }, []);

  const askForPermission = () => {
    const message = 'Would you like to help improve pedestrian analytics by sharing your location? (Anonymous, no personal data collected)';
    const userChoice = window.confirm(message);
    
    if (userChoice) {
      localStorage.setItem('pedestrian_tracking_permission', 'granted');
      setHasPermission(true);
      startTracking();
    } else {
      localStorage.setItem('pedestrian_tracking_permission', 'denied');
      setHasPermission(false);
    }
  };

  const startTracking = async () => {
    if (isTracking) return;

    try {
      // Get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Validate Bucharest bounds
            const BUCHAREST_BOUNDS = {
              min_lat: 44.35,
              max_lat: 44.55,
              min_lng: 25.95,
              max_lng: 26.25
            };

            if (
              BUCHAREST_BOUNDS.min_lat <= latitude && latitude <= BUCHAREST_BOUNDS.max_lat &&
              BUCHAREST_BOUNDS.min_lng <= longitude && longitude <= BUCHAREST_BOUNDS.max_lng
            ) {
              // Record pedestrian data
              const { recordPedestrianData } = await import('../services/pedestrianApi');
              await recordPedestrianData({
                lat: latitude,
                lng: longitude,
                timestamp: Math.floor(Date.now() / 1000),
              });
              setIsTracking(true);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000, // Accept cached position up to 1 minute old
          }
        );
      }
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  return {
    hasPermission,
    isTracking,
    askForPermission,
  };
};


