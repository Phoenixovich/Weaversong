import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRoleGuard } from '../hooks/useRoleGuard';
import { UserRole } from '../types/auth';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './PedestrianAnalyzer.css';

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
  const [selectedLocation, setSelectedLocation] = useState<PedestrianAnalytics | null>(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  // Check if user has access
  const hasAccess = user?.is_premium || isAdmin();

  useEffect(() => {
    if (hasAccess) {
      loadPopularLocations();
      loadAnalytics();
    }
  }, [hasAccess, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (dateRange.start_date) params.append('start_date', dateRange.start_date);
      if (dateRange.end_date) params.append('end_date', dateRange.end_date);

      const response = await fetch(`/pedestrian/analytics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('This feature requires premium subscription or admin role');
        }
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      alert(`Failed to load analytics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularLocations = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/pedestrian/popular-locations?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load popular locations');
      }

      const data = await response.json();
      setPopularLocations(data);
    } catch (error: any) {
      console.error('Failed to load popular locations:', error);
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
    <div className="container">
      <div className="content">
        <div className="header">
          <h1 className="title">🚶 Pedestrian Analyzer</h1>
          <p className="subtitle">
            Analyze pedestrian traffic patterns in Bucharest
          </p>
        </div>

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
            <button onClick={loadAnalytics} className="refreshButton">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Popular Locations */}
        {popularLocations.length > 0 && (
          <div className="section">
            <h2 className="sectionTitle">📍 Most Popular Locations</h2>
            <div className="locationsGrid">
              {popularLocations.map((loc, index) => (
                <div
                  key={index}
                  className="locationCard"
                  onClick={() => {
                    const found = analytics.find(a => 
                      Math.abs(a.lat - loc.lat) < 0.001 && Math.abs(a.lng - loc.lng) < 0.001
                    );
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
              ))}
            </div>
          </div>
        )}

        {/* Analytics Charts */}
        {loading ? (
          <div className="loading">Loading analytics...</div>
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
                      {selectedLocation.peak_hours.map(h => `${h}:00`).join(', ')}
                    </div>
                    <div className="statLabel">Peak Hours</div>
                  </div>
                </div>

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
                {analytics.slice(0, 6).map((item, index) => (
                  <div key={index} className="analyticsCard">
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
                    <button
                      onClick={() => setSelectedLocation(item)}
                      className="viewDetailsButton"
                    >
                      View Details
                    </button>
                  </div>
                ))}
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
  );
};


