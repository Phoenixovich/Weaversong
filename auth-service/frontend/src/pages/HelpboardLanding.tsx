import React, { useEffect, useState } from 'react';
import api, { helpdeskAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import RequestForm from '../components/RequestForm';
import ResponseForm from '../components/ResponseForm';
import { canAcceptResponse } from '../utils/permissions';

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

interface ResponseItem {
  _id: string;
  request_id: string;
  responder_id: string;
  message: string;
  status: string;
  date_created?: string;
}

const HelpboardLanding: React.FC = () => {
  const { user } = useAuth();
  const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
  const [myRequests, setMyRequests] = useState<RequestItem[]>([]);
  const [tradeMatches, setTradeMatches] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
  const [responses, setResponses] = useState<ResponseItem[]>([]);

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

  const fetchResponses = async () => {
    try {
      const res = await api.get<ResponseItem[]>('/helpboard/responses');
      setResponses(res.data || []);
    } catch (err) {
      console.error('Failed to load responses', err);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchResponses();
  }, []);

  useEffect(() => {
    computeLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRequests, user]);

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return '#28a745';
      case 'closed':
        return '#6c757d';
      case 'pending':
        return '#ffc107';
      case 'accepted':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const toggleRequest = (requestId: string) => {
    setExpandedRequests((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  };

  const handleResponseCreated = (requestId: string) => {
    fetchAll();
    fetchResponses();
    setExpandedRequests((prev) => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  };

  const toggleResponses = (requestId: string) => {
    setExpandedResponses((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  };

  const getResponsesForRequest = (requestId: string) => {
    if (!user) return [];
    const request = allRequests.find(r => r._id === requestId);
    if (!request || request.user_id !== user.id) {
      return [];
    }
    return responses.filter(r => r.request_id === requestId);
  };

  const getResponseStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return '#28a745';
      case 'declined':
        return '#dc3545';
      case 'pending':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const handleAcceptResponse = async (responseId: string, requestId: string, status: 'accepted' | 'declined') => {
    try {
      await helpdeskAPI.updateResponseStatus(responseId, status);
      // If accepting a response, automatically set the request status to "accepted"
      if (status === 'accepted') {
        await helpdeskAPI.updateRequest(requestId, { status: 'accepted' });
      }
      fetchResponses();
      fetchAll();
    } catch (error: any) {
      alert(`Failed to ${status === 'accepted' ? 'accept' : 'decline'} response: ${error.message}`);
    }
  };

  return (
    <div className="helpboard-page">
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>💼 Helpboard</h1>
        <p style={styles.headerSubtitle}>
          Find local help, post requests, and connect with skilled neighbours.
        </p>
        <div style={styles.controlsRow}>
          <button
            onClick={() => setShowRequestForm((s) => !s)}
            style={{
              ...styles.tabButton,
              ...(showRequestForm ? styles.tabButtonActive : {}),
            }}
          >
            {showRequestForm ? '✕ Close Form' : '+ Submit Request'}
          </button>
          {user && (
            <>
              <Link to="/helpboard/my-trades" style={styles.tabButton}>
                👷 My Trades
              </Link>
              <Link to="/helpboard/my-responses" style={styles.tabButton}>
                💬 My Responses
              </Link>
            </>
          )}
          <Link to="/helpboard/requests" style={styles.tabButton}>
            📣 All Requests
          </Link>
        </div>
      </div>

      <div style={styles.content}>
        {error && (
          <div style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

      {showRequestForm && (
        <div style={styles.formSection}>
          <RequestForm onCreated={() => { setShowRequestForm(false); fetchAll(); }} />
        </div>
      )}

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>📋 My Requests</h2>
          {!user ? (
            <div style={styles.emptyState}>
              <p>Please log in to see your requests.</p>
            </div>
          ) : loading ? (
            <div style={styles.loading}>
              <p>Loading requests…</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div style={styles.emptyState}>
              <p>You don't have any active requests yet.</p>
              <p style={styles.emptyHint}>Create one using the form above!</p>
            </div>
          ) : (
            <div style={styles.requestsList}>
              {myRequests.map((r) => (
                <div key={r._id} style={styles.requestCard}>
                  <div style={styles.requestHeader}>
                    <h3 style={styles.requestTitle}>{r.title}</h3>
                    <div style={styles.badges}>
                      {r.status && (
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: getStatusColor(r.status),
                            color: 'white',
                          }}
                        >
                          {r.status}
                        </span>
                      )}
                      {r.urgency && (
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: getUrgencyColor(r.urgency),
                            color: 'white',
                          }}
                        >
                          {r.urgency}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.description && (
                    <p style={styles.requestDescription}>{r.description}</p>
                  )}
                  <div style={styles.requestDetails}>
                    {r.trade_needed && (
                      <div style={styles.detailItem}>
                        <strong>Trade:</strong> {r.trade_needed}
                      </div>
                    )}
                    {r.budget !== undefined && r.budget > 0 && (
                      <div style={styles.detailItem}>
                        <strong>Budget:</strong> ${r.budget}
                      </div>
                    )}
                    {r.date_created && (
                      <div style={styles.detailItem}>
                        <strong>Created:</strong> {new Date(r.date_created).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {/* Quick Status Update - only for request owner */}
                  {user && r.user_id === user.id && (
                    <div style={styles.statusUpdateSection}>
                      <label style={styles.statusLabel}>Status:</label>
                      <select
                        value={r.status || 'open'}
                        onChange={async (e) => {
                          try {
                            await helpdeskAPI.updateRequest(r._id, { status: e.target.value });
                            fetchAll();
                          } catch (error: any) {
                            alert(`Failed to update status: ${error.message}`);
                          }
                        }}
                        style={styles.statusSelect}
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  )}
                  {/* Show responses button for my requests */}
                  {user && (
                    <button
                      onClick={() => toggleResponses(r._id)}
                      style={styles.expandButton}
                    >
                      {expandedResponses.has(r._id) ? '▼ Hide Responses' : '▶ View Responses'}
                    </button>
                  )}
                  {/* Display responses when expanded */}
                  {expandedResponses.has(r._id) && user && (
                    <div style={styles.responsesSection}>
                      {getResponsesForRequest(r._id).length > 0 ? (
                        <>
                          <h4 style={styles.responsesTitle}>Responses ({getResponsesForRequest(r._id).length})</h4>
                          {getResponsesForRequest(r._id).map((response) => (
                            <div key={response._id} style={styles.responseItem}>
                              <div style={styles.responseHeader}>
                                <p style={styles.responseMessage}>{response.message}</p>
                                <span
                                  style={{
                                    ...styles.badge,
                                    backgroundColor: getResponseStatusColor(response.status),
                                    color: 'white',
                                  }}
                                >
                                  {response.status}
                                </span>
                              </div>
                              {response.date_created && (
                                <div style={styles.responseDate}>
                                  {new Date(response.date_created).toLocaleString()}
                                </div>
                              )}
                              {/* Accept/Decline buttons - only for request owner */}
                              {r.user_id && canAcceptResponse(user, r.user_id) && response.status === 'pending' && (
                                <div style={styles.responseActions}>
                                  <button
                                    onClick={() => handleAcceptResponse(response._id, r._id, 'accepted')}
                                    style={styles.acceptButton}
                                  >
                                    ✅ Accept
                                  </button>
                                  <button
                                    onClick={() => handleAcceptResponse(response._id, r._id, 'declined')}
                                    style={styles.declineButton}
                                  >
                                    ❌ Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      ) : (
                        <p style={styles.emptyResponse}>No responses yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>🎯 Requests for Your Trade</h2>
          {!user ? (
            <div style={styles.emptyState}>
              <p>Please log in to see requests relevant to your trades.</p>
              <p style={styles.emptyHint}>Set up your trades in <Link to="/helpboard/my-trades" style={styles.inlineLink}>My Trades</Link> to get matched!</p>
            </div>
          ) : loading ? (
            <div style={styles.loading}>
              <p>Loading matches…</p>
            </div>
          ) : tradeMatches.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No open requests match your listed trades right now.</p>
              <p style={styles.emptyHint}>Check back later or browse <Link to="/helpboard/requests" style={styles.inlineLink}>all requests</Link>.</p>
            </div>
          ) : (
            <div style={styles.requestsList}>
              {tradeMatches.map((r) => (
                <div key={r._id} style={styles.requestCard}>
                  <div style={styles.requestHeader}>
                    <h3 style={styles.requestTitle}>{r.title}</h3>
                    <div style={styles.badges}>
                      {r.status && (
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: getStatusColor(r.status),
                            color: 'white',
                          }}
                        >
                          {r.status}
                        </span>
                      )}
                      {r.urgency && (
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: getUrgencyColor(r.urgency),
                            color: 'white',
                          }}
                        >
                          {r.urgency}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.description && (
                    <p style={styles.requestDescription}>{r.description}</p>
                  )}
                  <div style={styles.requestDetails}>
                    {r.trade_needed && (
                      <div style={styles.detailItem}>
                        <strong>Trade:</strong> {r.trade_needed}
                      </div>
                    )}
                    {r.budget !== undefined && r.budget > 0 && (
                      <div style={styles.detailItem}>
                        <strong>Budget:</strong> ${r.budget}
                      </div>
                    )}
                    {r.date_created && (
                      <div style={styles.detailItem}>
                        <strong>Created:</strong> {new Date(r.date_created).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {/* Only show response form for requests NOT owned by the user */}
                  {user && r.user_id !== user.id && (
                    <button
                      onClick={() => toggleRequest(r._id)}
                      style={styles.expandButton}
                    >
                      {expandedRequests.has(r._id) ? '▼ Hide Response Form' : '▶ Add Response'}
                    </button>
                  )}
                  {expandedRequests.has(r._id) && user && r.user_id !== user.id && (
                    <div style={styles.responseSection}>
                      <ResponseForm
                        request_id={r._id}
                        onCreated={() => handleResponseCreated(r._id)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      </div>
    </div>
  );
};

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
  tabButtonActive: {
    backgroundColor: 'white',
    color: '#20c997',
  },
  content: {
    minHeight: 'calc(100vh - 200px)',
    padding: '2rem 1rem',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f0fdfa',
  },
  errorBanner: {
    padding: '1rem',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '1px solid #ef5350',
  },
  formSection: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e9ecef',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: '#333',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '0.5rem',
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  requestCard: {
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    gap: '1rem',
  },
  requestTitle: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#333',
    flex: 1,
  },
  badges: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  requestDescription: {
    color: '#666',
    marginBottom: '0.75rem',
    lineHeight: '1.5',
  },
  requestDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e9ecef',
  },
  detailItem: {
    fontSize: '0.9rem',
    color: '#666',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    color: '#666',
  },
  emptyHint: {
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    color: '#999',
  },
  inlineLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '500',
  },
  expandButton: {
    marginTop: '0.75rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#20c997',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.3s',
    width: '100%',
  },
  responseSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef',
  },
  responsesSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef',
  },
  responsesTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: '#333',
  },
  responseItem: {
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    marginBottom: '0.75rem',
    border: '1px solid #e9ecef',
  },
  responseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '0.5rem',
  },
  responseMessage: {
    flex: 1,
    margin: 0,
    color: '#333',
    fontSize: '0.9rem',
    lineHeight: '1.5',
  },
  responseDate: {
    fontSize: '0.8rem',
    color: '#999',
    marginTop: '0.5rem',
  },
  responseActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e9ecef',
  },
  acceptButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  declineButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  emptyResponse: {
    color: '#666',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
  statusUpdateSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e9ecef',
  },
  statusLabel: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#333',
  },
  statusSelect: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    cursor: 'pointer',
    minWidth: '120px',
  },
};

export default HelpboardLanding;
