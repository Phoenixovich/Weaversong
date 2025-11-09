import { useState } from 'react';
import api from '../services/api';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAuth } from '../contexts/AuthContext';

interface RequestFormProps {
  onCreated?: () => void;
}

export default function RequestForm({ onCreated }: RequestFormProps) {
  const { requireAuth } = useAuthGuard();
  const { user } = useAuth();

  // don't require user_id input — derive from logged-in user
  const [form, setForm] = useState({ title: '', trade_needed: '', budget: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require authentication for creating requests
    requireAuth(async () => {
      // derive user id from auth context
      const userId = user?.id;
      if (!userId) return;

      // if we have a helpboard profile with location use it, otherwise fall back to default coords
      let location = { type: 'Point', coordinates: [12.4924, 41.8902] };
      try {
        const profileRes = await api.get('/helpboard/users/me');
        const profile = profileRes.data;
        if (profile?.location?.type === 'Point' && Array.isArray(profile.location.coordinates)) {
          location = profile.location;
        }
      } catch (err) {
        // ignore — we'll use default location
      }

      const payload = {
        user_id: userId,
        title: form.title,
        description: 'Need help locally.',
        trade_needed: form.trade_needed,
        location,
        radius_km: 2,
        status: 'open',
        urgency: 'normal',
        budget: Number(form.budget),
      };

      await api.post('/helpboard/requests', payload);
      setForm({ title: '', trade_needed: '', budget: 0 });
      onCreated?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Title *</label>
        <input
          type="text"
          placeholder="What do you need help with?"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Trade Needed *</label>
        <input
          type="text"
          placeholder="e.g., Plumber, Electrician, Carpenter"
          value={form.trade_needed}
          onChange={(e) => setForm({ ...form, trade_needed: e.target.value })}
          required
          style={styles.input}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Budget (optional)</label>
        <input
          type="number"
          placeholder="0"
          value={form.budget || ''}
          onChange={(e) => setForm({ ...form, budget: Number(e.target.value) || 0 })}
          min="0"
          style={styles.input}
        />
      </div>
      <button type="submit" style={styles.submitButton}>
        Create Request
      </button>
    </form>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background-color 0.3s',
    alignSelf: 'flex-start',
  },
};
