import { useState } from 'react';
import api from '../services/api';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAuth } from '../contexts/AuthContext';
import './RequestForm.css';

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
    <form onSubmit={handleSubmit} className="form">
      {/* Tab Navigation */}
      <div className="tabContainer">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`tabButton ${activeTab === 'basic' ? 'tabButtonActive' : ''}`}
        >
          Basic Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`tabButton ${activeTab === 'details' ? 'tabButtonActive' : ''}`}
        >
          Details
        </button>
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div className="tabContent">
          <div className="formGroup">
            <label className="label">Title *</label>
            <input
              type="text"
              placeholder="What do you need help with?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="input"
            />
          </div>
          <div className="formGroup">
            <label className="label">Trade Needed *</label>
            <input
              type="text"
              placeholder="e.g., Plumber, Electrician, Carpenter"
              value={form.trade_needed}
              onChange={(e) => setForm({ ...form, trade_needed: e.target.value })}
              required
              className="input"
            />
          </div>
          <div className="formGroup">
            <label className="label">Budget (optional)</label>
            <input
              type="number"
              placeholder="0"
              value={form.budget || ''}
              onChange={(e) => setForm({ ...form, budget: Number(e.target.value) || 0 })}
              min="0"
              className="input"
            />
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="tabContent">
          <div className="formGroup">
            <label className="label">Description</label>
            <textarea
              placeholder="Provide more details about what you need..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="textarea"
            />
          </div>
          <div className="formGroup">
            <label className="label">Urgency</label>
            <select
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              className="select"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      )}

      <button type="submit" className="submitButton">
        Create Request
      </button>
    </form>
  );
}
