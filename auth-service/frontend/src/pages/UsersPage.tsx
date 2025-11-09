import { useState, useEffect } from 'react';
import api from '../services/api';
import UserForm from '../components/UserForm';
import { useAuthGuard } from '../hooks/useAuthGuard';
import './UsersPage.css';

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
        () => {
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
        () => {
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
    <div className="container">
      <div className="header">
        <h1 className="title">👷 Nearby Helpers</h1>
        <p className="subtitle">Find local professionals and offer your services</p>
      </div>

      <div className="createSection">
        <h2 className="sectionTitle">Add Your Profile</h2>
        <UserForm onCreated={handleCreateUser} />
      </div>

      <div className="searchSection">
        <h2 className="sectionTitle">Search Helpers</h2>
        <div className="searchBar">
          <input
            className="searchInput"
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
            className="searchButton"
            onClick={searchByTrade}
            disabled={!tradeSearch.trim() || loading}
          >
            Search
          </button>
          <button
            className="resetButton"
            onClick={fetchNearby}
            disabled={loading}
          >
            Show Nearby
          </button>
        </div>
      </div>

      {error && (
        <div className="errorMessage">
          {error}
        </div>
      )}

      <div className="listSection">
        <h2 className="sectionTitle">
          {tradeSearch ? `Results for "${tradeSearch}"` : 'Nearby Helpers'} ({users.length})
        </h2>
        {loading ? (
          <p className="loading">Loading helpers...</p>
        ) : users.length === 0 ? (
          <div className="emptyState">
            <p>No helpers found. Try adjusting your search or location.</p>
          </div>
        ) : (
          <div className="usersGrid">
            {users.map((u) => (
              <div key={u._id} className="userCard">
                <div className="userHeader">
                  <h3 className="userTitle">
                    {u.trades?.map((t) => t.name).join(', ') || 'No trades listed'}
                  </h3>
                  <span
                    className="availabilityBadge"
                    style={{
                      backgroundColor: getAvailabilityColor(u.availability),
                      color: 'white',
                    }}
                  >
                    {u.availability}
                  </span>
                </div>
                <div className="userDetails">
                  {u.trades && u.trades.length > 0 && (
                    <div className="tradesList">
                      {u.trades.map((trade, index) => (
                        <div key={index} className="tradeItem">
                          <strong>{trade.name}</strong>
                          {trade.experience_years > 0 && (
                            <span className="experience">
                              {trade.experience_years} year{trade.experience_years !== 1 ? 's' : ''} experience
                            </span>
                          )}
                          {trade.rate && (
                            <span className="rate">${trade.rate}/hr</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="metaInfo">
                    <div className="metaItem">
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

