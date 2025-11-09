import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface RequestItem {
  _id: string;
  title: string;
  description?: string;
  trade_needed?: string;
  status?: string;
  urgency?: string;
  budget?: number;
  user_id?: string;
  date_created?: string;
}

const HelpboardLanding: React.FC = () => {
  const { user } = useAuth();
  const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
  const [myRequests, setMyRequests] = useState<RequestItem[]>([]);
  const [tradeMatches, setTradeMatches] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<RequestItem[]>('/helpboard/requests');
      setAllRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load requests', err);
      setError('Failed to load helpboard requests.');
    } finally {
      setLoading(false);
    }
  };

  const computeLists = async () => {
    if (!user) return;

    // My requests (match by user id stored in auth user)
    const my = allRequests.filter((r) => r.user_id === user.id);
    setMyRequests(my);

    // Get my helpboard profile to know trades
    try {
      const profile = await api.get<any>('/helpboard/users/me');
      const trades: string[] = profile.data?.trades?.map((t: any) => t.name) || [];
      if (trades.length === 0) {
        setTradeMatches([]);
        return;
      }

      // Match requests whose trade_needed contains one of my trades (case-insensitive)
      const lowerTrades = trades.map((t) => t.toLowerCase());
      const matches = allRequests.filter((r) => {
        if (!r.trade_needed) return false;
        const needed = r.trade_needed.toLowerCase();
        return lowerTrades.some((tr) => needed.includes(tr));
      });
      setTradeMatches(matches);
    } catch (err) {
      console.warn('Failed to fetch helpboard profile', err);
      // If profile fetch fails we still keep myRequests computed from auth user
      setTradeMatches([]);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    computeLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRequests, user]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Welcome to Helpboard</h1>
        <p style={styles.subtitle}>Find local help, post requests, and connect with skilled neighbours.</p>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        <div style={{ marginBottom: '1rem', gridColumn: '1 / -1', textAlign: 'right' }}>
          <Link to="/helpboard/my-trades" style={styles.ctaButton}>My Trades</Link>
        </div>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>My Requests</h2>
          {!user ? (
            <p>Please log in to see your requests.</p>
          ) : loading ? (
            <p>Loading…</p>
          ) : myRequests.length === 0 ? (
            <p>You don't have any active requests. Create one on the Requests page.</p>
          ) : (
            myRequests.map((r) => (
              <div key={r._id} style={styles.requestItem}>
                <div style={styles.requestHeader}>
                  <strong>{r.title}</strong>
                  <span style={styles.meta}>{r.date_created ? new Date(r.date_created).toLocaleDateString() : ''}</span>
                </div>
                {r.description && <div style={styles.description}>{r.description}</div>}
                {r.trade_needed && <div style={styles.badge}>{r.trade_needed}</div>}
              </div>
            ))
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Requests for Your Trade</h2>
          {!user ? (
            <p>Please log in to see requests relevant to your trades.</p>
          ) : loading ? (
            <p>Loading…</p>
          ) : tradeMatches.length === 0 ? (
            <p>No open requests match your listed trades right now.</p>
          ) : (
            tradeMatches.map((r) => (
              <div key={r._id} style={styles.requestItem}>
                <div style={styles.requestHeader}>
                  <strong>{r.title}</strong>
                  <span style={styles.meta}>{r.date_created ? new Date(r.date_created).toLocaleDateString() : ''}</span>
                </div>
                {r.description && <div style={styles.description}>{r.description}</div>}
                <div style={styles.requestFooter}>
                  {r.trade_needed && <div style={styles.badge}>{r.trade_needed}</div>}
                  {r.budget !== undefined && <div style={styles.meta}>${r.budget}</div>}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

const styles: { [k: string]: React.CSSProperties } = {
  container: { maxWidth: 1100, margin: '2rem auto', padding: '0 1rem' },
  header: { textAlign: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '2rem', margin: 0 },
  subtitle: { color: '#666' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  card: { background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { marginTop: 0, marginBottom: '0.75rem' },
  requestItem: { padding: '0.6rem 0', borderBottom: '1px solid #eee' },
  requestHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  meta: { color: '#888', fontSize: '0.85rem' },
  description: { color: '#555', marginTop: '0.4rem' },
  badge: { display: 'inline-block', marginTop: '0.5rem', background: '#f1f1f1', padding: '0.25rem 0.5rem', borderRadius: 6, fontSize: '0.85rem' },
  requestFooter: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' },
  error: { padding: '0.6rem', background: '#ffebeb', color: '#8a1f1f', borderRadius: 6, marginBottom: '1rem' },
};

export default HelpboardLanding;
