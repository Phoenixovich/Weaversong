import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRoleGuard } from '../hooks/useRoleGuard';
import { UserRole } from '../types/auth';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
}

interface PopularLocation {
  lat: number;
  lng: number;
  location_name: string | null;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const PedestrianAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, hasAnyRole } = useRoleGuard();
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

  const loadPopularLocations = async () => {
    try {
      const data = await getPopularLocations(
        10,
        dateRange.start_date,
        dateRange.end_date,
        timeframe || undefined
      );
      setPopularLocations(data);
    } catch (error: any) {
      console.error('Failed to load popular locations:', error);
    }
  };

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
      setPopularLocations(popularLocs);

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
            setAnalytics(prev => {
              // Check if this location already exists in analytics
              const existingIndex = prev.findIndex(a => 
                Math.abs(a.lat - location.lat) < 0.001 && 
                Math.abs(a.lng - location.lng) < 0.001
              );
              
              if (existingIndex >= 0) {
                // Update existing
                const updated = [...prev];
                updated[existingIndex] = analyticsData[0] || prev[existingIndex];
                return updated;
              } else {
                // Add new
                return [...prev, ...analyticsData];
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
        setAnalytics(analyticsData);
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
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🚶 Pedestrian Analyzer</h1>
          <p style={styles.message}>
            This feature requires a premium subscription or admin role.
          </p>
          <p style={styles.message}>
            Upgrade to premium to access pedestrian analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🚶 Pedestrian Analyzer</h1>
          <p style={styles.subtitle}>
            Analyze pedestrian traffic patterns in Bucharest
          </p>
        </div>

        {/* Filters */}
        <div style={styles.filterCard}>
          <h3 style={styles.filterTitle}>Filters</h3>
          <div style={styles.dateInputs}>
            <div>
              <label style={styles.label}>Start Date:</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                style={styles.dateInput}
              />
            </div>
            <div>
              <label style={styles.label}>End Date:</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                style={styles.dateInput}
              />
            </div>
            <div>
              <label style={styles.label}>Timeframe:</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                style={styles.dateInput}
              >
                <option value="">All Day</option>
                <option value="morning">Morning (6 AM - 12 PM)</option>
                <option value="daytime">Daytime (12 PM - 6 PM)</option>
                <option value="evening">Evening (6 PM - 10 PM)</option>
                <option value="night">Night (10 PM - 6 AM)</option>
              </select>
            </div>
            <button onClick={loadAnalyticsProgressive} style={styles.refreshButton}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Popular Locations */}
        {popularLocations.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📍 Most Popular Locations</h2>
            <div style={styles.locationsGrid}>
              {popularLocations.map((loc, index) => (
                <div
                  key={index}
                  style={styles.locationCard}
                  onClick={() => {
                    const found = analytics.find(a => 
                      Math.abs(a.lat - loc.lat) < 0.001 && Math.abs(a.lng - loc.lng) < 0.001
                    );
                    if (found) setSelectedLocation(found);
                  }}
                >
                  <h3 style={styles.locationName}>
                    {loc.location_name || `Location ${index + 1}`}
                  </h3>
                  <p style={styles.locationCount}>{loc.count.toLocaleString()} visits</p>
                  <p style={styles.locationCoords}>
                    {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Charts */}
        {loading && analytics.length === 0 ? (
          <div style={styles.loading}>Loading analytics for most popular locations...</div>
        ) : analytics.length > 0 ? (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📊 Analytics Overview</h2>
            
            {selectedLocation ? (
              <div style={styles.detailCard}>
                <div style={styles.detailHeader}>
                  <h3>{selectedLocation.location_name || 'Selected Location'}</h3>
                  <button onClick={() => setSelectedLocation(null)} style={styles.closeButton}>
                    ✕
                  </button>
                </div>
                
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{selectedLocation.total_count.toLocaleString()}</div>
                    <div style={styles.statLabel}>Total Visits</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{selectedLocation.average_per_hour}</div>
                    <div style={styles.statLabel}>Avg per Hour</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>
                      {selectedLocation.peak_hours.map(h => `${h}:00`).join(', ')}
                    </div>
                    <div style={styles.statLabel}>Peak Hours</div>
                  </div>
                </div>

                <div style={styles.chartContainer}>
                  <h4 style={styles.chartTitle}>Hourly Traffic Pattern</h4>
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

                <div style={styles.chartContainer}>
                  <h4 style={styles.chartTitle}>Daily Traffic Pattern</h4>
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
              <div style={styles.analyticsGrid}>
                {analytics.slice(0, 6).map((item, index) => {
                  const locationKey = `${item.lat.toFixed(4)}_${item.lng.toFixed(4)}`;
                  const isLoading = loadingLocations.includes(locationKey);
                  
                  return (
                    <div key={index} style={styles.analyticsCard}>
                      {isLoading && (
                        <div style={styles.loadingOverlay}>
                          <div style={styles.loadingText}>Loading...</div>
                        </div>
                      )}
                      <h3 style={styles.analyticsLocation}>
                        {item.location_name || `Location ${index + 1}`}
                      </h3>
                      <div style={styles.analyticsStats}>
                        <div style={styles.analyticsStat}>
                          <strong style={styles.analyticsStatValue}>{item.total_count.toLocaleString()}</strong>
                          <span style={styles.analyticsStatLabel}>Total</span>
                        </div>
                        <div style={styles.analyticsStat}>
                          <strong style={styles.analyticsStatValue}>{item.average_per_hour}</strong>
                          <span style={styles.analyticsStatLabel}>Avg/Hour</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedLocation(item)}
                        style={styles.viewDetailsButton}
                        disabled={isLoading}
                      >
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p>No analytics data available for the selected date range.</p>
            <p style={styles.emptyHint}>
              Make sure test data has been created. Run the test data script to populate the database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '2rem 1rem',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
    color: '#333',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  message: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '1rem',
  },
  filterCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
  },
  filterTitle: {
    marginBottom: '1rem',
    color: '#333',
  },
  dateInputs: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    color: '#666',
  },
  dateInput: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  refreshButton: {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  section: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: '#333',
  },
  locationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
  },
  locationCard: {
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px solid #e9ecef',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  locationName: {
    margin: '0 0 0.5rem 0',
    color: '#333',
  },
  locationCount: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#007bff',
    margin: '0.5rem 0',
  },
  locationCoords: {
    fontSize: '0.85rem',
    color: '#666',
    margin: 0,
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  analyticsCard: {
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    position: 'relative',
  },
  analyticsLocation: {
    margin: '0 0 1rem 0',
    color: '#333',
  },
  analyticsStats: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  analyticsStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  analyticsStatValue: {
    fontSize: '1.5rem',
    color: '#007bff',
    fontWeight: 'bold',
  },
  analyticsStatLabel: {
    fontSize: '0.85rem',
    color: '#666',
  },
  viewDetailsButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  detailCard: {
    padding: '2rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  closeButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e9ecef',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '0.5rem',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#666',
  },
  chartContainer: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
  chartTitle: {
    marginBottom: '1rem',
    color: '#333',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.2rem',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#666',
  },
  emptyHint: {
    marginTop: '1rem',
    fontSize: '0.9rem',
    color: '#999',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    zIndex: 1,
  },
  loadingText: {
    fontSize: '0.9rem',
    color: '#666',
  },
};

