import { useEffect, useState } from 'react';
import helpboardAPI, { Trade } from '../services/helpboardApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    <div style={styles?.container ?? { maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={styles?.header ?? {}}>
        <h1 style={styles?.title ?? {}}>👷 My Trades</h1>
        <p style={styles?.subtitle ?? {}}>Manage the trades you offer on Helpboard.</p>
      </div>

      <div style={styles?.card ?? {}}>

        {error && <div style={styles?.error ?? { background: '#fee', color: '#800', padding: 8, borderRadius: 6 }}>{error}</div>}

        <div style={styles?.actions ?? { margin: '1rem 0' }}>
        <button onClick={startAdd} style={{ marginRight: 8 }}>+ Add Trade</button>
        <button onClick={() => navigate('/helpboard')}>Back to Helpboard</button>
      </div>

      {loading ? (
        <p>Loading trades…</p>
      ) : trades.length === 0 ? (
        <p>No trades yet. Add one to start receiving matching requests.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {trades.map((t, idx) => (
            <div key={t.name + idx} style={{ padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
              {editingIndex === idx ? (
                <div>
                  <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  <label style={{ display: 'block', marginTop: 8 }}>Years experience</label>
                  <input type="number" value={draft.experience_years || 0} onChange={(e) => setDraft({ ...draft, experience_years: Number(e.target.value) })} />
                  <label style={{ display: 'block', marginTop: 8 }}>Rate</label>
                  <input type="number" value={draft.rate || ''} onChange={(e) => setDraft({ ...draft, rate: e.target.value ? Number(e.target.value) : undefined })} />
                  <label style={{ display: 'block', marginTop: 8 }}>Description</label>
                  <textarea value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                  <div style={{ marginTop: 8 }}>
                    <button onClick={saveEdit} style={{ marginRight: 8 }}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{t.name}</strong>
                    <div style={{ color: '#666' }}>{t.experience_years ? `${t.experience_years} yrs` : ''} {t.rate ? `• $${t.rate}/hr` : ''}</div>
                    {t.description && <div style={{ marginTop: 6 }}>{t.description}</div>}
                  </div>
                  <div>
                    <button onClick={() => startEdit(idx)} style={{ marginRight: 8 }}>Edit</button>
                    <button onClick={() => removeTrade(t.name)} style={{ color: '#b00' }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div style={{ marginTop: 16, padding: 12, border: '1px dashed #ccc', borderRadius: 6 }}>
          <h3>Add Trade</h3>
          <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <label style={{ display: 'block', marginTop: 8 }}>Years experience</label>
          <input type="number" value={draft.experience_years || 0} onChange={(e) => setDraft({ ...draft, experience_years: Number(e.target.value) })} />
          <label style={{ display: 'block', marginTop: 8 }}>Rate</label>
          <input type="number" value={draft.rate || ''} onChange={(e) => setDraft({ ...draft, rate: e.target.value ? Number(e.target.value) : undefined })} />
          <label style={{ display: 'block', marginTop: 8 }}>Description</label>
          <textarea value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div style={{ marginTop: 8 }}>
            <button onClick={saveAdd} style={{ marginRight: 8 }}>Add</button>
            <button onClick={cancelAdd}>Cancel</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1000px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  header: {
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
  },
  subtitle: { color: '#666' },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  button: {
    padding: '0.5rem 0.9rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  buttonSecondary: {
    padding: '0.5rem 0.9rem',
    backgroundColor: '#f8f9fa',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: 6,
    cursor: 'pointer',
  },
  buttonDanger: {
    padding: '0.45rem 0.8rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  error: {
    padding: 8,
    background: '#fee',
    color: '#800',
    borderRadius: 6,
    marginBottom: 12,
  },
  emptyState: {
    padding: 12,
    background: '#f8f9fa',
    borderRadius: 6,
  },
  tradesList: {
    display: 'grid',
    gap: 12,
  },
  tradeCard: {
    padding: 12,
    border: '1px solid #eee',
    borderRadius: 6,
    background: 'white',
  },
  tradeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: { color: '#666', marginTop: 4 },
  label: { display: 'block', marginTop: 8, marginBottom: 6, fontWeight: 600 },
  input: { width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: 8, minHeight: 80, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box' },
  addForm: { marginTop: 16, padding: 12, border: '1px dashed #ccc', borderRadius: 6 },
};
