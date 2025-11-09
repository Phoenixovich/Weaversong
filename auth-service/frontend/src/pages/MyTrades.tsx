import { useEffect, useState } from 'react';
import helpboardAPI, { Trade } from '../services/helpboardApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './MyTrades.css';

const emptyTrade = (): Trade => ({ name: '', experience_years: 0, description: '', rate: undefined });

export default function MyTrades() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Trade>(emptyTrade());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await helpboardAPI.getMyProfile();
      setTrades(profile.trades || []);
    } catch (err) {
      console.error('Failed to load profile', err);
      setError('Failed to load your trades. Please log in and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      // Not authenticated — send to helpboard landing or login
      navigate('/helpboard');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const startEdit = (idx: number) => {
    setEditingIndex(idx);
    setDraft({ ...trades[idx] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraft(emptyTrade());
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;
    const originalName = trades[editingIndex].name;
    try {
      await helpboardAPI.updateTrade(originalName, draft);
      await load();
      cancelEdit();
    } catch (err: any) {
      console.error('Failed to update trade', err);
      setError(err?.response?.data?.detail || 'Failed to update trade.');
    }
  };

  const removeTrade = async (name: string) => {
    if (!confirm(`Delete trade "${name}"?`)) return;
    try {
      await helpboardAPI.deleteTrade(name);
      await load();
    } catch (err: any) {
      console.error('Failed to delete trade', err);
      setError(err?.response?.data?.detail || 'Failed to delete trade.');
    }
  };

  const startAdd = () => {
    setAdding(true);
    setDraft(emptyTrade());
  };

  const cancelAdd = () => {
    setAdding(false);
    setDraft(emptyTrade());
  };

  const saveAdd = async () => {
    if (!draft.name || !draft.name.trim()) {
      setError('Trade name is required');
      return;
    }
    try {
      await helpboardAPI.addTrade(draft);
      await load();
      cancelAdd();
    } catch (err: any) {
      console.error('Failed to add trade', err);
      setError(err?.response?.data?.detail || 'Failed to add trade.');
    }
  };

  return (
    <div className="helpboard-page">
      <div className="header">
        <h1 className="headerTitle">👷 My Trades</h1>
        <p className="headerSubtitle">
          Manage the trades you offer on Helpboard.
        </p>
        <div className="controlsRow">
          <button
            onClick={() => navigate('/helpboard')}
            className="tabButton"
          >
            ← Back to Helpboard
          </button>
        </div>
      </div>

      <div className="content">
        <div className="card">

        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button onClick={startAdd} className="primaryButton">+ Add Trade</button>
        </div>

      {loading ? (
        <div className="loading">
          <p>Loading trades…</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="emptyState">
          <p>No trades yet. Add one to start receiving matching requests.</p>
        </div>
      ) : (
        <div className="tradesList">
          {trades.map((t, idx) => (
            <div key={t.name + idx} className="tradeCard">
              {editingIndex === idx ? (
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  <label className="label">Years experience</label>
                  <input type="number" className="input" value={draft.experience_years || 0} onChange={(e) => setDraft({ ...draft, experience_years: Number(e.target.value) })} />
                  <label className="label">Rate</label>
                  <input type="number" className="input" value={draft.rate || ''} onChange={(e) => setDraft({ ...draft, rate: e.target.value ? Number(e.target.value) : undefined })} />
                  <label className="label">Description</label>
                  <textarea className="textarea" value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                  <div style={{ marginTop: 8, display: 'flex', gap: '0.5rem' }}>
                    <button onClick={saveEdit} className="primaryButton">Save</button>
                    <button onClick={cancelEdit} className="secondaryButton">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="tradeRow">
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{t.name}</strong>
                    <div className="meta">{t.experience_years ? `${t.experience_years} yrs` : ''} {t.rate ? `• $${t.rate}/hr` : ''}</div>
                    {t.description && <div style={{ marginTop: 6, color: '#666' }}>{t.description}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => startEdit(idx)} className="editButton">Edit</button>
                    <button onClick={() => removeTrade(t.name)} className="deleteButton">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="addForm">
          <h3 style={{ marginTop: 0 }}>Add Trade</h3>
          <label className="label">Name</label>
          <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <label className="label">Years experience</label>
          <input type="number" className="input" value={draft.experience_years || 0} onChange={(e) => setDraft({ ...draft, experience_years: Number(e.target.value) })} />
          <label className="label">Rate</label>
          <input type="number" className="input" value={draft.rate || ''} onChange={(e) => setDraft({ ...draft, rate: e.target.value ? Number(e.target.value) : undefined })} />
          <label className="label">Description</label>
          <textarea className="textarea" value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div style={{ marginTop: 8, display: 'flex', gap: '0.5rem' }}>
            <button onClick={saveAdd} className="primaryButton">Add</button>
            <button onClick={cancelAdd} className="secondaryButton">Cancel</button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
