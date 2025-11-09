import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import api from '../services/api';
import RequestForm from '../components/RequestForm';
import ResponseForm from '../components/ResponseForm';
import { UserBadge } from '../components/UserBadge';

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
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💼 Helpboard</h1>
        <p style={styles.subtitle}>Connect with local helpers and offer your services</p>
      </div>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'requests' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('requests')}
        >
          📣 Requests ({requests.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'responses' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('responses')}
        >
          💬 Responses ({responses.length})
        </button>
      </div>

      {activeTab === 'requests' && (
        <div style={styles.content}>
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
                    <div style={styles.responseSection}>
                      <ResponseForm
                        request_id={request._id}
                        onCreated={() => {
                          fetchRequests();
                          fetchResponses();
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'responses' && (
        <div style={styles.content}>
          <h2 style={styles.sectionTitle}>All Responses</h2>
          {loading ? (
            <p style={styles.loading}>Loading responses...</p>
          ) : responses.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No responses yet.</p>
            </div>
          ) : (
            <div style={styles.responsesList}>
              {responses.map((response) => (
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
          )}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
    color: '#333',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
  },
  tabs: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '2px solid #e0e0e0',
  },
  tab: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.3s',
  },
  activeTab: {
    color: '#007bff',
    borderBottomColor: '#007bff',
  },
  content: {
    marginTop: '2rem',
  },
  createSection: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
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
};

