import { useState, useEffect } from 'react';
import api from '../services/api';

interface ResponseItem {
  _id: string;
  request_id: string;
  responder_id: string;
  message: string;
  status: string;
  date_created?: string;
}

export default function ResponsesPage() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchResponses();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      case 'pending':
        return '#ffc107';
      case 'completed':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const handleDelete = async (response: ResponseItem) => {
    if (!response.responder_id) return;
    if (!confirm(`Are you sure you want to delete this response?`)) {
      return;
    }

    setDeletingId(response._id);
    try {
      await helpdeskAPI.deleteResponse(response._id);
      fetchResponses();
      alert('Response deleted successfully!');
    } catch (error: any) {
      alert(`Failed to delete response: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💬 Responses</h1>
        <p style={styles.subtitle}>View all responses to help requests</p>
      </div>

      <div style={styles.content}>
        <div style={styles.statsBar}>
          <div style={styles.statItem}>
            <strong>Total Responses:</strong> {responses.length}
          </div>
          <div style={styles.statItem}>
            <strong>Pending:</strong>{' '}
            {responses.filter((r) => r.status === 'pending').length}
          </div>
          <div style={styles.statItem}>
            <strong>Accepted:</strong>{' '}
            {responses.filter((r) => r.status === 'accepted').length}
          </div>
        </div>

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
                    <strong>Request ID:</strong> {response.request_id}
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
                <div style={styles.responseBody}>
                  <p style={styles.responseMessage}>{response.message}</p>
                  <div style={styles.responseMeta}>
                    <div style={styles.metaItem}>
                      <strong>Responder:</strong> {response.responder_id}
                    </div>
                    {response.date_created && (
                      <div style={styles.metaItem}>
                        <strong>Date:</strong>{' '}
                        {new Date(response.date_created).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Edit/Delete Buttons */}
                  {response.responder_id && (canEditResponse(user, response.responder_id) || canDeleteResponse(user, response.responder_id)) && (
                    <div style={styles.actionButtons}>
                      {canEditResponse(user, response.responder_id) && (
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
                      {canDeleteResponse(user, response.responder_id) && (
                        <button
                          onClick={() => handleDelete(response)}
                          disabled={deletingId === response._id}
                          style={styles.deleteButton}
                        >
                          {deletingId === response._id ? 'Deleting...' : '🗑️ Delete'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
  content: {
    marginTop: '2rem',
  },
  statsBar: {
    display: 'flex',
    gap: '2rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  statItem: {
    color: '#666',
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
  responsesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  responseCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e9ecef',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  responseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e9ecef',
  },
  responseInfo: {
    color: '#666',
    fontSize: '0.9rem',
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  responseBody: {
    marginTop: '1rem',
  },
  responseMessage: {
    color: '#333',
    lineHeight: '1.6',
    marginBottom: '1rem',
    fontSize: '1rem',
  },
  responseMeta: {
    display: 'flex',
    gap: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid #f0f0f0',
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: '0.9rem',
    color: '#666',
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
