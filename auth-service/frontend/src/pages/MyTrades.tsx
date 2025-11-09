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
    <div className="helpboard-page">
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>👷 My Trades</h1>
        <p style={styles.headerSubtitle}>
          Manage the trades you offer on Helpboard.
        </p>
        <div style={styles.controlsRow}>
          <button
            onClick={() => navigate('/helpboard')}
            style={styles.tabButton}
          >
            ← Back to Helpboard
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.actions}>
          <button onClick={startAdd} style={styles.primaryButton}>+ Add Trade</button>
        </div>

      {loading ? (
        <div style={styles.loading}>
          <p>Loading trades…</p>
        </div>
      ) : trades.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No trades yet. Add one to start receiving matching requests.</p>
        </div>
      ) : (
        <div style={styles.tradesList}>
          {trades.map((t, idx) => (
            <div key={t.name + idx} style={styles.tradeCard}>
              {editingIndex === idx ? (
                <div>
                  <label style={styles.label}>Name</label>
                  <input style={styles.input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  <label style={styles.label}>Years experience</label>
                  <input type="number" style={styles.input} value={draft.experience_years || 0} onChange={(e) => setDraft({ ...draft, experience_years: Number(e.target.value) })} />
                  <label style={styles.label}>Rate</label>
                  <input type="number" style={styles.input} value={draft.rate || ''} onChange={(e) => setDraft({ ...draft, rate: e.target.value ? Number(e.target.value) : undefined })} />
                  <label style={styles.label}>Description</label>
                  <textarea style={styles.textarea} value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                  <div style={{ marginTop: 8, display: 'flex', gap: '0.5rem' }}>
                    <button onClick={saveEdit} style={styles.primaryButton}>Save</button>
                    <button onClick={cancelEdit} style={styles.secondaryButton}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={styles.tradeRow}>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{t.name}</strong>
                    <div style={styles.meta}>{t.experience_years ? `${t.experience_years} yrs` : ''} {t.rate ? `• $${t.rate}/hr` : ''}</div>
                    {t.description && <div style={{ marginTop: 6, color: '#666' }}>{t.description}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => startEdit(idx)} style={styles.editButton}>Edit</button>
                    <button onClick={() => removeTrade(t.name)} style={styles.deleteButton}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div style={styles.addForm}>
          <h3 style={{ marginTop: 0 }}>Add Trade</h3>
          <label style={styles.label}>Name</label>
          <input style={styles.input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <label style={styles.label}>Years experience</label>
          <input type="number" style={styles.input} value={draft.experience_years || 0} onChange={(e) => setDraft({ ...draft, experience_years: Number(e.target.value) })} />
          <label style={styles.label}>Rate</label>
          <input type="number" style={styles.input} value={draft.rate || ''} onChange={(e) => setDraft({ ...draft, rate: e.target.value ? Number(e.target.value) : undefined })} />
          <label style={styles.label}>Description</label>
          <textarea style={styles.textarea} value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div style={{ marginTop: 8, display: 'flex', gap: '0.5rem' }}>
            <button onClick={saveAdd} style={styles.primaryButton}>Add</button>
            <button onClick={cancelAdd} style={styles.secondaryButton}>Cancel</button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    color: 'white',
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#20c997',
  },
  headerTitle: {
    margin: 0,
    fontSize: '2.5rem',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    margin: '0.5rem 0 1rem 0',
    fontSize: '1.1rem',
    opacity: 0.9,
  },
  controlsRow: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  tabButton: {
    padding: '0.75rem 1.5rem',
    border: '2px solid white',
    backgroundColor: 'transparent',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
    textDecoration: 'none',
    display: 'inline-block',
  },
  content: {
    minHeight: 'calc(100vh - 200px)',
    padding: '2rem 1rem',
    maxWidth: '1000px',
    margin: '0 auto',
    backgroundColor: '#f0fdfa',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    alignItems: 'center',
  },
  primaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#20c997',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f8f9fa',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  editButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  error: {
    padding: '1rem',
    background: '#ffebee',
    color: '#c62828',
    borderRadius: '6px',
    marginBottom: '1rem',
    border: '1px solid #ef5350',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    background: '#f8f9fa',
    borderRadius: '6px',
    color: '#666',
  },
  tradesList: {
    display: 'grid',
    gap: '1rem',
  },
  tradeCard: {
    padding: '1rem',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
  },
  tradeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  meta: {
    color: '#666',
    marginTop: '0.25rem',
    fontSize: '0.9rem',
  },
  label: {
    display: 'block',
    marginTop: '0.75rem',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box',
    fontSize: '1rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    minHeight: '80px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  addForm: {
    marginTop: '1rem',
    padding: '1.5rem',
    border: '2px dashed #20c997',
    borderRadius: '8px',
    backgroundColor: '#f0fdfa',
  },
};
