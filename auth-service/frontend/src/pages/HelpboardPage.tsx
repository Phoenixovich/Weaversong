import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import api, { helpdeskAPI } from '../services/api';
import RequestForm from '../components/RequestForm';
import ResponseForm from '../components/ResponseForm';
import { UserBadge } from '../components/UserBadge';
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

export default function HelpboardPage() {
  const { user } = useAuth();
  const { requireAuth } = useAuthGuard();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'responses'>('requests');
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
      fetchResponses(); // Also fetch responses to show them on requests
    } else {
      fetchResponses();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get<RequestItem[]>('/helpboard/requests');
      setRequests(res.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await api.get<ResponseItem[]>('/helpboard/responses');
      setResponses(res.data);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = () => {
    requireAuth(() => {
      fetchRequests();
    });
  };

  const handleCreateResponse = (requestId: string) => {
    requireAuth(() => {
      setSelectedRequest(requestId);
      fetchResponses();
    });
  };

  const handleAcceptResponse = async (responseId: string, status: 'accepted' | 'declined') => {
    try {
      await helpdeskAPI.updateResponseStatus(responseId, status);
      fetchResponses();
      fetchRequests(); // Refresh to update request status if needed
    } catch (error: any) {
      alert(`Failed to ${status === 'accepted' ? 'accept' : 'decline'} response: ${error.message}`);
    }
  };

  const getResponsesForRequest = (requestId: string) => {
    // Only show responses if the current user owns the request
    const request = requests.find(r => r._id === requestId);
    if (!user || !request || request.user_id !== user.id) {
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

  return (
    <div className="helpboard-page">
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>💼 Helpboard</h1>
        <p style={styles.headerSubtitle}>
          Connect with local helpers and offer your services
        </p>
        <div style={styles.controlsRow}>
          <div style={styles.tabSelector}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'requests' ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab('requests')}
            >
              📣 Requests ({requests.length})
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'responses' ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab('responses')}
            >
              💬 Responses ({responses.length})
            </button>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {activeTab === 'requests' && (
          <div>
            <div style={styles.createSection}>
            <h2 style={styles.sectionTitle}>Create a Request</h2>
            <RequestForm onCreated={handleCreateRequest} />
          </div>

          <div style={styles.listSection}>
            <h2 style={styles.sectionTitle}>All Requests</h2>
            {loading ? (
              <p style={styles.loading}>Loading requests...</p>
            ) : requests.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No requests yet. Be the first to create one!</p>
              </div>
            ) : (
              <div style={styles.requestsGrid}>
                {requests.map((request) => (
                  <div key={request._id} style={styles.requestCard}>
                    <div style={styles.requestHeader}>
                      <h3 style={styles.requestTitle}>{request.title}</h3>
                      <div style={styles.badges}>
                        {request.status && (
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: getStatusColor(request.status),
                              color: 'white',
                            }}
                          >
                            {request.status}
                          </span>
                        )}
                        {request.urgency && (
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: getUrgencyColor(request.urgency),
                              color: 'white',
                            }}
                          >
                            {request.urgency} urgency
                          </span>
                        )}
                      </div>
                    </div>
                    {request.description && (
                      <p style={styles.requestDescription}>{request.description}</p>
                    )}
                    <div style={styles.requestDetails}>
                      {request.trade_needed && (
                        <div style={styles.detailItem}>
                          <strong>Trade:</strong> {request.trade_needed}
                        </div>
                      )}
                      {request.budget && (
                        <div style={styles.detailItem}>
                          <strong>Budget:</strong> ${request.budget}
                        </div>
                      )}
                      {request.date_created && (
                        <div style={styles.detailItem}>
                          <strong>Created:</strong>{' '}
                          {new Date(request.date_created).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {/* Responses Section */}
                    {getResponsesForRequest(request._id).length > 0 && (
                      <div style={styles.responsesSection}>
                        <h4 style={styles.responsesTitle}>Responses ({getResponsesForRequest(request._id).length})</h4>
                        {getResponsesForRequest(request._id).map((response) => (
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
                            {request.user_id && canAcceptResponse(user, request.user_id) && response.status === 'pending' && (
                              <div style={styles.responseActions}>
                                <button
                                  onClick={() => handleAcceptResponse(response._id, 'accepted')}
                                  style={styles.acceptButton}
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  onClick={() => handleAcceptResponse(response._id, 'declined')}
                                  style={styles.declineButton}
                                >
                                  ❌ Decline
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Only show response form for requests NOT owned by the user */}
                    {user && request.user_id !== user.id && (
                      <div style={styles.responseSection}>
                        <ResponseForm
                          request_id={request._id}
                          onCreated={() => {
                            fetchRequests();
                            fetchResponses();
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div>
            <h2 style={styles.sectionTitle}>All Responses</h2>
          {loading ? (
            <p style={styles.loading}>Loading responses...</p>
          ) : !user ? (
            <div style={styles.emptyState}>
              <p>Please log in to see responses to your requests.</p>
            </div>
          ) : (() => {
            const userRequestIds = new Set(
              requests.filter(r => r.user_id === user.id).map(r => r._id)
            );
            const filteredResponses = responses.filter(r => userRequestIds.has(r.request_id));
            return filteredResponses.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No responses to your requests yet.</p>
              </div>
            ) : (
              <div style={styles.responsesList}>
                {filteredResponses.map((response) => (
                <div key={response._id} style={styles.responseCard}>
                  <div style={styles.responseHeader}>
                    <div style={styles.responseInfo}>
                      <strong>Response to Request:</strong> {response.request_id}
                    </div>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: getStatusColor(response.status),
                        color: 'white',
                      }}
                    >
                      {response.status}
                    </span>
                  </div>
                  <p style={styles.responseMessage}>{response.message}</p>
                  {response.date_created && (
                    <div style={styles.responseDate}>
                      {new Date(response.date_created).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            );
          })()}
        </div>
        )}
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
    gap: '2rem',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  tabSelector: {
    display: 'flex',
    gap: '1rem',
  },
  tabButton: {
    padding: '0.75rem 2rem',
    border: '2px solid white',
    backgroundColor: 'transparent',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
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
  createSection: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  listSection: {
    marginTop: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: '#333',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    color: '#666',
  },
  requestsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  requestCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e9ecef',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  requestTitle: {
    margin: 0,
    fontSize: '1.25rem',
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
    marginBottom: '1rem',
    lineHeight: '1.5',
  },
  requestDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef',
  },
  detailItem: {
    fontSize: '0.9rem',
    color: '#666',
  },
  responseSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef',
  },
  responsesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  responseCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e9ecef',
  },
  responseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  responseInfo: {
    color: '#666',
    fontSize: '0.9rem',
  },
  responseMessage: {
    color: '#333',
    lineHeight: '1.6',
    marginBottom: '0.5rem',
  },
  responseDate: {
    fontSize: '0.85rem',
    color: '#999',
    marginTop: '0.5rem',
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
};

