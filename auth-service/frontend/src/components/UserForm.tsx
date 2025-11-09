import { useState } from 'react';
import api from '../services/api';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAuth } from '../contexts/AuthContext';

interface UserFormProps {
  onCreated?: () => void;
}

export default function UserForm({ onCreated }: UserFormProps) {
  const { requireAuth } = useAuthGuard();
  const { user } = useAuth();

  // user_id is not entered manually — derive from logged-in user
  const [form, setForm] = useState({ trade: '', experience_years: 1, availability: 'available' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require authentication for creating/editing user profiles
    requireAuth(async () => {
      const userId = user?.id;
      if (!userId) return;

      const payload = {
        // use PUT /helpboard/users/me to upsert the profile for the current user
        location: { type: 'Point', coordinates: [12.4924, 41.8902] },
        radius_km: 3,
        trades: [{ name: form.trade, experience_years: form.experience_years }],
        availability: form.availability,
      };

      await api.put('/helpboard/users/me', payload);
      setForm({ trade: '', experience_years: 1, availability: 'available' });
      onCreated?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <input placeholder="Trade" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} required />
      <input type="number" placeholder="Experience" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} min={1} required />
      <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
        <option value="available">Available</option>
        <option value="busy">Busy</option>
      </select>
      <button type="submit">Add</button>
    </form>
  );
}
