import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRoleGuard } from '../hooks/useRoleGuard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PedestrianAnalyzer.css';
import { getPedestrianAnalytics, getPopularLocations } from '../services/pedestrianApi';

interface PedestrianAnalytics {
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

interface PopularLocation {
  lat: number;
  lng: number;
  location_name: string | null;
  count: number;
}

export const PedestrianAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoleGuard();
  const [analytics, setAnalytics] = useState<PedestrianAnalytics[]>([]);
  const [popularLocations, setPopularLocations] = useState<PopularLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState<string[]>([]); // Track which locations are being loaded
  const [selectedLocation, setSelectedLocation] = useState<PedestrianAnalytics | null>(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [timeframe, setTimeframe] = useState<string>('');

  // Check if user has access
  const hasAccess = user?.is_premium || isAdmin();

  useEffect(() => {
    if (hasAccess) {
      loadAnalyticsProgressive();
    }
  }, [hasAccess, dateRange, timeframe]);

  const loadAnalyticsProgressive = async () => {
    setLoading(true);
    setAnalytics([]);
    
    try {
      // First, load popular locations
      const popularLocs = await getPopularLocations(
        10,
        dateRange.start_date,
        dateRange.end_date,
        timeframe || undefined
      );
      setPopularLocations(Array.isArray(popularLocs) ? popularLocs : []);

      // If we have popular locations, load analytics for them progressively
      if (popularLocs.length > 0) {
        // Load analytics for each popular location progressively
        for (const location of popularLocs) {
          const locationKey = `${location.lat.toFixed(4)}_${location.lng.toFixed(4)}`;
          setLoadingLocations(prev => [...prev, locationKey]);
          
          try {
            const analyticsData = await getPedestrianAnalytics({
              lat: location.lat,
              lng: location.lng,
              radius: 0.01,
              start_date: dateRange.start_date,
              end_date: dateRange.end_date,
              timeframe: timeframe || undefined
            });

            // Add new analytics to the existing list
            const analyticsArray = Array.isArray(analyticsData) ? analyticsData : [];
            setAnalytics(prev => {
              // Check if this location already exists in analytics
              const existingIndex = prev.findIndex(a => 
                Math.abs(a.lat - location.lat) < 0.001 && 
                Math.abs(a.lng - location.lng) < 0.001
              );
              
              if (existingIndex >= 0) {
                // Update existing
                const updated = [...prev];
                updated[existingIndex] = analyticsArray[0] || prev[existingIndex];
                return updated;
              } else {
                // Add new
                return [...prev, ...analyticsArray];
              }
            });
          } catch (error: any) {
            console.error(`Failed to load analytics for location ${locationKey}:`, error);
          } finally {
            setLoadingLocations(prev => prev.filter(key => key !== locationKey));
          }
        }
      } else {
        // Fallback: load all analytics if no popular locations
        const analyticsData = await getPedestrianAnalytics({
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          timeframe: timeframe || undefined
        });
        setAnalytics(Array.isArray(analyticsData) ? analyticsData : []);
      }
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      alert(`Failed to load analytics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatHourlyData = (hourlyStats: { [hour: string]: number }) => {
    const data = [];
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        hour: `${hour}:00`,
        count: hourlyStats[hour.toString()] || 0
      });
    }
    return data;
  };

  const formatDailyData = (dailyStats: { [day: string]: number }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map((day, index) => ({
      day,
      count: dailyStats[index.toString()] || 0
    }));
  };

  if (!hasAccess) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="title">🚶 Pedestrian Analyzer</h1>
          <p className="message">
            This feature requires a premium subscription or admin role.
          </p>
          <p className="message">
            Upgrade to premium to access pedestrian analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            🚶 Pedestrian Analyzer
          </h1>
          <p className="text-xl text-gray-600">
            Analyze pedestrian traffic patterns in Bucharest
          </p>
        </header>

        <div>
          {/* Date Range Filter */}
          <div className="filterCard">
          <h3 className="filterTitle">Date Range</h3>
          <div className="dateInputs">
            <div>
              <label className="label">Start Date:</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="dateInput"
              />
            </div>
            <div>
              <label className="label">End Date:</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="dateInput"
              />
            </div>
            <div>
              <label className="label">Timeframe:</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="dateInput"
              >
                <option value="">All Time</option>
                <option value="morning">Morning (6-12)</option>
                <option value="daytime">Daytime (12-18)</option>
                <option value="evening">Evening (18-22)</option>
                <option value="night">Night (22-6)</option>
              </select>
            </div>
            <button onClick={loadAnalyticsProgressive} className="refreshButton">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Popular Locations */}
        {popularLocations.length > 0 && (
          <div className="section">
            <h2 className="sectionTitle">📍 Most Popular Locations</h2>
            <div className="locationsGrid">
              {Array.isArray(popularLocations) ? popularLocations.map((loc, index) => (
                <div
                  key={index}
                  className="locationCard"
                  onClick={() => {
                    const found = Array.isArray(analytics) ? analytics.find(a => 
                      Math.abs(a.lat - loc.lat) < 0.001 && Math.abs(a.lng - loc.lng) < 0.001
                    ) : undefined;
                    if (found) setSelectedLocation(found);
                  }}
                >
                  <h3 className="locationName">
                    {loc.location_name || `Location ${index + 1}`}
                  </h3>
                  <p className="locationCount">{loc.count.toLocaleString()} visits</p>
                  <p className="locationCoords">
                    {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                  </p>
                </div>
              )) : []}
            </div>
          </div>
        )}

        {/* Analytics Charts */}
        {loading && analytics.length === 0 ? (
          <div className="loading">Loading analytics for most popular locations...</div>
        ) : analytics.length > 0 ? (
          <div className="section">
            <h2 className="sectionTitle">📊 Analytics Overview</h2>
            
            {selectedLocation ? (
              <div className="detailCard">
                <div className="detailHeader">
                  <h3>{selectedLocation.location_name || 'Selected Location'}</h3>
                  <button onClick={() => setSelectedLocation(null)} className="closeButton">
                    ✕
                  </button>
                </div>
                
                <div className="statsGrid">
                  <div className="statCard">
                    <div className="statValue">{selectedLocation.total_count.toLocaleString()}</div>
                    <div className="statLabel">Total Visits</div>
                  </div>
                  <div className="statCard">
                    <div className="statValue">{selectedLocation.average_per_hour}</div>
                    <div className="statLabel">Avg per Hour</div>
                  </div>
                  <div className="statCard">
                    <div className="statValue">
                      {Array.isArray(selectedLocation.peak_hours) ? selectedLocation.peak_hours.map(h => `${h}:00`).join(', ') : 'N/A'}
                    </div>
                    <div className="statLabel">Peak Hours</div>
                  </div>
                </div>

                {/* Business Suggestions */}
                {selectedLocation.business_suggestions && Array.isArray(selectedLocation.business_suggestions) && selectedLocation.business_suggestions.length > 0 && (
                  <div className="suggestionsCard">
                    <h4 className="suggestionsTitle">💡 Business Suggestions</h4>
                    <p className="suggestionsSubtitle">
                      Based on peak hours and traffic patterns, these business types would be ideal for this location:
                    </p>
                    <div className="suggestionsList">
                      {selectedLocation.business_suggestions.map((suggestion, index) => (
                        <div key={index} className="suggestionItem">
                          <span className="suggestionIcon">
                            {suggestion === 'Coffee Shop' && '☕'}
                            {suggestion === 'Pastry Shop' && '🥐'}
                            {suggestion === 'Vending Machine' && '🥤'}
                            {suggestion === 'Restaurant' && '🍽️'}
                            {suggestion === 'Fast Food' && '🍔'}
                            {suggestion === 'Night Club' && '🎉'}
                            {suggestion === 'Bar' && '🍺'}
                            {suggestion === 'Convenience Store' && '🏪'}
                            {suggestion === 'Food Truck' && '🚚'}
                            {!['Coffee Shop', 'Pastry Shop', 'Vending Machine', 'Restaurant', 'Fast Food', 'Night Club', 'Bar', 'Convenience Store', 'Food Truck'].includes(suggestion) && '💼'}
                          </span>
                          <span className="suggestionText">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="chartContainer">
                  <h4 className="chartTitle">Hourly Traffic Pattern</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formatHourlyData(selectedLocation.hourly_stats)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chartContainer">
                  <h4 className="chartTitle">Daily Traffic Pattern</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formatDailyData(selectedLocation.daily_stats)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="analyticsGrid">
                {Array.isArray(analytics) ? analytics.slice(0, 6).map((item, index) => {
                  const locationKey = `${item.lat.toFixed(4)}_${item.lng.toFixed(4)}`;
                  const isLoading = loadingLocations.includes(locationKey);
                  
                  return (
                    <div key={index} className="analyticsCard">
                      {isLoading && (
                        <div className="loadingOverlay">
                          <div className="loadingText">Loading...</div>
                        </div>
                      )}
                      <h3 className="analyticsLocation">
                        {item.location_name || `Location ${index + 1}`}
                      </h3>
                      <div className="analyticsStats">
                        <div className="analyticsStat">
                          <strong className="analyticsStatValue">{item.total_count.toLocaleString()}</strong>
                          <span className="analyticsStatLabel">Total</span>
                        </div>
                        <div className="analyticsStat">
                          <strong className="analyticsStatValue">{item.average_per_hour}</strong>
                          <span className="analyticsStatLabel">Avg/Hour</span>
                        </div>
                      </div>
                      {item.business_suggestions && Array.isArray(item.business_suggestions) && item.business_suggestions.length > 0 && (
                        <div className="quickSuggestions">
                          <div className="quickSuggestionsLabel">Suggestions:</div>
                          <div className="quickSuggestionsList">
                            {item.business_suggestions.slice(0, 2).map((suggestion, idx) => (
                              <span key={idx} className="quickSuggestionTag">
                                {suggestion}
                              </span>
                            ))}
                            {item.business_suggestions.length > 2 && (
                              <span className="quickSuggestionTag">
                                +{item.business_suggestions.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedLocation(item)}
                        className="viewDetailsButton"
                        disabled={isLoading}
                      >
                        View Details
                      </button>
                    </div>
                  );
                }) : []}
              </div>
            )}
          </div>
        ) : (
          <div className="emptyState">
            <p>No analytics data available for the selected date range.</p>
            <p className="emptyHint">
              Make sure test data has been created. Run the test data script to populate the database.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

