import React, { useState, useEffect, useRef } from 'react';
import { GeolocationTracker, collectLocation, getStatistics, analyzeLocations, LocationAnalysisResult } from '../services/pedestrianApi';
import './PedestrianTracker.css';

const PedestrianTracker: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<LocationAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const trackerRef = useRef<GeolocationTracker | null>(null);
  const locationBufferRef = useRef<Array<{ location: any; timestamp: number }>>([]);

  useEffect(() => {
    loadStatistics();
    
    // Cleanup on unmount
    return () => {
      if (trackerRef.current) {
        trackerRef.current.stopTracking();
      }
    };
  }, []);

  const loadStatistics = async () => {
    try {
      const statistics = await getStatistics();
      setStats(statistics);
    } catch (err: any) {
      console.error('Error loading statistics:', err);
    }
  };

  const startTracking = async () => {
    try {
      setError(null);
      const tracker = new GeolocationTracker();
      trackerRef.current = tracker;

      await tracker.startTracking({
        interval: 30000, // Collect every 30 seconds
        enableHighAccuracy: true,
        timeout: 10000,
        onLocationUpdate: async (location) => {
          setCurrentLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy ?? null,
            altitude: null,
            altitudeAccuracy: null,
            heading: location.heading ?? null,
            speed: location.speed ?? null
          } as GeolocationCoordinates);

          // Add to buffer
          locationBufferRef.current.push({
            location,
            timestamp: Date.now()
          });

          // Send location to server
          try {
            await collectLocation(location);
          } catch (err) {
            console.error('Error sending location:', err);
          }
        },
        onError: (geoError) => {
          let errorMessage = 'Unknown geolocation error';
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case geoError.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case geoError.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setError(errorMessage);
          setIsTracking(false);
        }
      });

      setIsTracking(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start tracking');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (trackerRef.current) {
      trackerRef.current.stopTracking();
      trackerRef.current = null;
    }
    setIsTracking(false);
    setCurrentLocation(null);
    loadStatistics(); // Refresh stats
  };

  const runAnalysis = async (analysisType: 'comprehensive' | 'business_spots' | 'dead_areas' | 'dangerous_areas' = 'comprehensive') => {
    setIsAnalyzing(true);
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Last 30 days

      const result = await analyzeLocations({
        analysis_type: analysisType,
        start_date: startDate,
        end_date: endDate
      });

      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze locations');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="pedestrian-tracker">
      <div className="tracker-header">
        <h2>Pedestrian Geolocation Tracker</h2>
        <p className="description">
          Track pedestrian movement patterns to identify business opportunities, areas of interest, and safety concerns.
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="tracker-controls">
        <div className="control-section">
          <h3>Location Tracking</h3>
          {!isTracking ? (
            <button onClick={startTracking} className="btn btn-primary">
              Start Tracking
            </button>
          ) : (
            <button onClick={stopTracking} className="btn btn-danger">
              Stop Tracking
            </button>
          )}

          {currentLocation && (
            <div className="current-location">
              <h4>Current Location</h4>
              <p><strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}</p>
              <p><strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}</p>
              {currentLocation.accuracy && (
                <p><strong>Accuracy:</strong> {currentLocation.accuracy.toFixed(2)} meters</p>
              )}
              {currentLocation.speed !== null && (
                <p><strong>Speed:</strong> {(currentLocation.speed * 3.6).toFixed(2)} km/h</p>
              )}
            </div>
          )}
        </div>

        {stats && (
          <div className="stats-section">
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Locations</span>
                <span className="stat-value">{stats.total_locations || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Unique Users</span>
                <span className="stat-value">{stats.unique_users || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sessions</span>
                <span className="stat-value">{stats.unique_sessions || 0}</span>
              </div>
            </div>
          </div>
        )}

        <div className="analysis-section">
          <h3>AI Analysis</h3>
          <div className="analysis-buttons">
            <button
              onClick={() => runAnalysis('comprehensive')}
              disabled={isAnalyzing}
              className="btn btn-secondary"
            >
              Comprehensive Analysis
            </button>
            <button
              onClick={() => runAnalysis('business_spots')}
              disabled={isAnalyzing}
              className="btn btn-secondary"
            >
              Business Opportunities
            </button>
            <button
              onClick={() => runAnalysis('dead_areas')}
              disabled={isAnalyzing}
              className="btn btn-secondary"
            >
              Dead Areas
            </button>
            <button
              onClick={() => runAnalysis('dangerous_areas')}
              disabled={isAnalyzing}
              className="btn btn-secondary"
            >
              Dangerous Areas
            </button>
          </div>

          {isAnalyzing && (
            <div className="analyzing">
              <p>Analyzing location data...</p>
            </div>
          )}

          {analysisResult && (
            <div className="analysis-result">
              <h4>Analysis Results</h4>
              <div className="result-stats">
                <p><strong>Total Locations Analyzed:</strong> {analysisResult.total_locations}</p>
                <p><strong>Unique Users:</strong> {analysisResult.unique_users}</p>
                <p><strong>Analysis Type:</strong> {analysisResult.analysis_type}</p>
              </div>
              <div className="ai-insights">
                <h5>AI Insights</h5>
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{
                    __html: analysisResult.insights.ai_analysis
                      .replace(/\n/g, '<br>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/## (.*?)(<br>|$)/g, '<h3>$1</h3>')
                      .replace(/### (.*?)(<br>|$)/g, '<h4>$1</h4>')
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PedestrianTracker;


