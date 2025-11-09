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

  const [activeTab, setActiveTab] = useState<'basic' | 'details'>('basic');
  // don't require user_id input — derive from logged-in user
  const [form, setForm] = useState({ 
    title: '', 
    trade_needed: '', 
    budget: 0,
    description: '',
    urgency: 'normal',
    status: 'open'
  });

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
        description: form.description || 'Need help locally.',
        trade_needed: form.trade_needed,
        location,
        radius_km: 2,
        status: 'open', // Always create new requests with "open" status
        urgency: form.urgency,
        budget: Number(form.budget) || 0,
      };

      await api.post('/helpboard/requests', payload);
      setForm({ title: '', trade_needed: '', budget: 0, description: '', urgency: 'normal', status: 'open' });
      setActiveTab('basic');
      onCreated?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'basic' ? styles.tabButtonActive : {}),
          }}
        >
          Basic Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'details' ? styles.tabButtonActive : {}),
          }}
        >
          Details
        </button>
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div style={styles.tabContent}>
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
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div style={styles.tabContent}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              placeholder="Provide more details about what you need..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              style={styles.textarea}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Urgency</label>
            <select
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              style={styles.select}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      )}

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
    marginTop: '1rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    borderBottom: '2px solid #e9ecef',
  },
  tabButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    color: '#666',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all 0.3s',
    marginBottom: '-2px',
  },
  tabButtonActive: {
    color: '#20c997',
    borderBottomColor: '#20c997',
    fontWeight: '600',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '100px',
    transition: 'border-color 0.3s',
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.3s',
  },
  selectDisabled: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    backgroundColor: '#f8f9fa',
    cursor: 'not-allowed',
    color: '#666',
    opacity: 0.7,
  },
  helpText: {
    fontSize: '0.85rem',
    color: '#666',
    marginTop: '0.5rem',
    marginBottom: 0,
    fontStyle: 'italic',
  },
};
