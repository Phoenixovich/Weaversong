import { useState, useEffect } from 'react';
import api, { helpdeskAPI } from '../services/api';
import RequestForm from '../components/RequestForm';
import ResponseForm from '../components/ResponseForm';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { canEditRequest, canDeleteRequest } from '../utils/permissions';

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

export default function RequestsPage() {
  const { requireAuth } = useAuthGuard();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = () => {
    requireAuth(() => {
      fetchRequests();
    });
  };

  const handleDelete = async (request: RequestItem) => {
    if (!request.user_id) return;
    if (!confirm(`Are you sure you want to delete "${request.title}"?`)) {
      return;
    }

    setDeletingId(request._id);
    try {
      await helpdeskAPI.deleteRequest(request._id);
      fetchRequests();
      alert('Request deleted successfully!');
    } catch (error: any) {
      alert(`Failed to delete request: ${error.message}`);
    } finally {
      setDeletingId(null);
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📣 Help Requests</h1>
        <p style={styles.subtitle}>Post your requests and get help from the community</p>
      </div>

      <div style={styles.createSection}>
        <h2 style={styles.sectionTitle}>Create a Request</h2>
        <RequestForm onCreated={handleCreateRequest} />
      </div>

      <div style={styles.listSection}>
        <h2 style={styles.sectionTitle}>All Requests ({requests.length})</h2>
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
                        {request.urgency}
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
                    }}
                  />
                </div>

                {/* Edit/Delete Buttons */}
                {request.user_id && (canEditRequest(user, request.user_id) || canDeleteRequest(user, request.user_id)) && (
                  <div style={styles.actionButtons}>
                    {canEditRequest(user, request.user_id) && (
                      <button
                        onClick={() => {
                          // TODO: Implement edit modal/form
                          alert('Edit functionality coming soon!');
                        }}
                        style={styles.editButton}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {canDeleteRequest(user, request.user_id) && (
                      <button
                        onClick={() => handleDelete(request)}
                        disabled={deletingId === request._id}
                        style={styles.deleteButton}
                      >
                        {deletingId === request._id ? 'Deleting...' : '🗑️ Delete'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
    gap: '1rem',
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
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e9ecef',
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
    transition: 'background-color 0.3s',
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
    transition: 'background-color 0.3s',
  },
};
