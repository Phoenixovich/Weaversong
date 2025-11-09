import { useState } from 'react';
import api from '../services/api';
import { useAuthGuard } from '../hooks/useAuthGuard';

interface RequestFormProps {
  onCreated?: () => void;
}

export default function RequestForm({ onCreated }: RequestFormProps) {
  const { requireAuth } = useAuthGuard();
  const [form, setForm] = useState({ user_id: '', title: '', trade_needed: '', budget: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require authentication for creating requests
    requireAuth(async () => {
      const payload = {
        user_id: form.user_id,
        title: form.title,
        description: 'Need help locally.',
        trade_needed: form.trade_needed,
        location: { type: 'Point', coordinates: [12.4924, 41.8902] },
        radius_km: 2,
        status: 'open',
        urgency: 'normal',
        budget: Number(form.budget),
      };

      await api.post('/helpboard/requests', payload);
      setForm({ user_id: '', title: '', trade_needed: '', budget: 0 });
      onCreated?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <input placeholder="User ID" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required />
      <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <input placeholder="Trade Needed" value={form.trade_needed} onChange={(e) => setForm({ ...form, trade_needed: e.target.value })} required />
      <input type="number" placeholder="Budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
      <button type="submit">Create</button>
    </form>
  );
}
