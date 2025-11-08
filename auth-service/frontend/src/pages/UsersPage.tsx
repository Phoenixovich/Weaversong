import { useState, useEffect } from 'react';
import api from '../services/api';
import UserForm from '../components/UserForm';

interface Trade { name: string; experience_years: number; description?: string; rate?: number }
interface User { _id: string; user_id: string; trades: Trade[]; availability: string; radius_km: number; location?: { type: string; coordinates: [number, number] } }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tradeSearch, setTradeSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchNearby = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const res = await api.get<User[]>(`/helpboard/users/nearby?lat=${latitude}&lon=${longitude}&radius_km=3`);
      setUsers(res.data);
      setLoading(false);
    });
  };

  const searchByTrade = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const res = await api.get<User[]>(`/helpboard/users/search?trade=${tradeSearch}&lat=${latitude}&lon=${longitude}&radius_km=3`);
      setUsers(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchNearby(); }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>👷 Nearby Helpers</h2>
      <UserForm onCreated={fetchNearby} />
      <div style={{ marginBottom: '1rem' }}>
        <input placeholder="Search by trade (e.g. Plumber)" value={tradeSearch} onChange={(e) => setTradeSearch(e.target.value)} />
        <button onClick={searchByTrade} disabled={!tradeSearch}>Search</button>
        <button onClick={fetchNearby}>Show Nearby</button>
      </div>
      {loading ? <p>Loading...</p> : (
        <ul>
          {users.map((u) => (
            <li key={u._id} style={{ background: '#f4f4f4', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
              <strong>{u.trades?.map((t) => t.name).join(', ') || 'No trades listed'}</strong> — {u.availability}
              <div style={{ fontSize: '0.9em', color: '#666' }}>Radius: {u.radius_km} km</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
