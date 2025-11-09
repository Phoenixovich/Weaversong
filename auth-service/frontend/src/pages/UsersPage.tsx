import { useState, useEffect } from 'react';
import api from '../services/api';
import UserForm from '../components/UserForm';
import { useAuthGuard } from '../hooks/useAuthGuard';

interface Trade {
  name: string;
  experience_years: number;
  description?: string;
  rate?: number;
}

interface User {
  _id: string;
  user_id: string;
  trades: Trade[];
  availability: string;
  radius_km: number;
  location?: { type: string; coordinates: [number, number] };
}

export default function UsersPage() {
  const { requireAuth } = useAuthGuard();
  const [users, setUsers] = useState<User[]>([]);
  const [tradeSearch, setTradeSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearby = async () => {
    setLoading(true);
    setError(null);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const res = await api.get<User[]>(
            `/helpboard/users/nearby?lat=${latitude}&lon=${longitude}&radius_km=3`
          );
          setUsers(res.data);
          setLoading(false);
        },
        (err) => {
          setError('Failed to get location. Please enable location services.');
          setLoading(false);
        }
      );
    } catch (error) {
      setError('Failed to fetch nearby users.');
      setLoading(false);
    }
  };

  const searchByTrade = async () => {
    if (!tradeSearch.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const res = await api.get<User[]>(
            `/helpboard/users/search?trade=${tradeSearch}&lat=${latitude}&lon=${longitude}&radius_km=3`
          );
          setUsers(res.data);
          setLoading(false);
        },
        (err) => {
          setError('Failed to get location. Please enable location services.');
          setLoading(false);
        }
      );
    } catch (error) {
      setError('Failed to search users.');
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    requireAuth(() => {
      fetchNearby();
    });
  };

  useEffect(() => {
    fetchNearby();
  }, []);

  const getAvailabilityColor = (availability: string) => {
    switch (availability?.toLowerCase()) {
      case 'available':
        return '#28a745';
      case 'busy':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👷 Nearby Helpers</h1>
        <p style={styles.subtitle}>Find local professionals and offer your services</p>
      </div>

      <div style={styles.createSection}>
        <h2 style={styles.sectionTitle}>Add Your Profile</h2>
        <UserForm onCreated={handleCreateUser} />
      </div>

      <div style={styles.searchSection}>
        <h2 style={styles.sectionTitle}>Search Helpers</h2>
        <div style={styles.searchBar}>
          <input
            style={styles.searchInput}
            placeholder="Search by trade (e.g. Plumber, Electrician)"
            value={tradeSearch}
            onChange={(e) => setTradeSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                searchByTrade();
              }
            }}
          />
          <button
            style={styles.searchButton}
            onClick={searchByTrade}
            disabled={!tradeSearch.trim() || loading}
          >
            Search
          </button>
          <button
            style={styles.resetButton}
            onClick={fetchNearby}
            disabled={loading}
          >
            Show Nearby
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      <div style={styles.listSection}>
        <h2 style={styles.sectionTitle}>
          {tradeSearch ? `Results for "${tradeSearch}"` : 'Nearby Helpers'} ({users.length})
        </h2>
        {loading ? (
          <p style={styles.loading}>Loading helpers...</p>
        ) : users.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No helpers found. Try adjusting your search or location.</p>
          </div>
        ) : (
          <div style={styles.usersGrid}>
            {users.map((u) => (
              <div key={u._id} style={styles.userCard}>
                <div style={styles.userHeader}>
                  <h3 style={styles.userTitle}>
                    {u.trades?.map((t) => t.name).join(', ') || 'No trades listed'}
                  </h3>
                  <span
                    style={{
                      ...styles.availabilityBadge,
                      backgroundColor: getAvailabilityColor(u.availability),
                      color: 'white',
                    }}
                  >
                    {u.availability}
                  </span>
                </div>
                <div style={styles.userDetails}>
                  {u.trades && u.trades.length > 0 && (
                    <div style={styles.tradesList}>
                      {u.trades.map((trade, index) => (
                        <div key={index} style={styles.tradeItem}>
                          <strong>{trade.name}</strong>
                          {trade.experience_years > 0 && (
                            <span style={styles.experience}>
                              {trade.experience_years} year{trade.experience_years !== 1 ? 's' : ''} experience
                            </span>
                          )}
                          {trade.rate && (
                            <span style={styles.rate}>${trade.rate}/hr</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={styles.metaInfo}>
                    <div style={styles.metaItem}>
                      <strong>Service Radius:</strong> {u.radius_km} km
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
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
  createSection: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  searchSection: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: '#333',
  },
  searchBar: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  searchButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
  resetButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
  listSection: {
    marginTop: '2rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    color: '#666',
  },
  errorMessage: {
    padding: '0.75rem',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  usersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  userCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e9ecef',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  userHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '1rem',
  },
  userTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#333',
    flex: 1,
  },
  availabilityBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  userDetails: {
    marginTop: '1rem',
  },
  tradesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  tradeItem: {
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  experience: {
    fontSize: '0.9rem',
    color: '#666',
  },
  rate: {
    fontSize: '0.9rem',
    color: '#007bff',
    fontWeight: '500',
  },
  metaInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef',
  },
  metaItem: {
    fontSize: '0.9rem',
    color: '#666',
  },
};
