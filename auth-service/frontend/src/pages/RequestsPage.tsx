import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { helpdeskAPI } from '../services/api';
import RequestForm from '../components/RequestForm';
import ResponseForm from '../components/ResponseForm';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { canEditRequest, canDeleteRequest, canAcceptResponse } from '../utils/permissions';

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

export default function RequestsPage() {
  const { requireAuth } = useAuthGuard();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<RequestItem | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', trade_needed: '', budget: 0 });
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

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
    try {
      const res = await api.get<ResponseItem[]>('/helpboard/responses');
      setResponses(res.data);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchResponses();
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

  const handleEdit = (request: RequestItem) => {
    setEditingRequest(request);
    setEditForm({
      title: request.title,
      description: request.description || '',
      trade_needed: request.trade_needed || '',
      budget: request.budget || 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;

    try {
      await helpdeskAPI.updateRequest(editingRequest._id, {
        title: editForm.title,
        description: editForm.description,
        trade_needed: editForm.trade_needed,
        budget: editForm.budget,
      });
      setEditingRequest(null);
      fetchRequests();
      alert('Request updated successfully!');
    } catch (error: any) {
      alert(`Failed to update request: ${error.message}`);
    }
  };

  const handleAcceptResponse = async (responseId: string, status: 'accepted' | 'declined') => {
    setUpdatingStatusId(responseId);
    try {
      await helpdeskAPI.updateResponseStatus(responseId, status);
      fetchResponses();
      fetchRequests(); // Refresh to update request status if needed
    } catch (error: any) {
      alert(`Failed to ${status === 'accepted' ? 'accept' : 'decline'} response: ${error.message}`);
    } finally {
      setUpdatingStatusId(null);
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

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return '#28a745';
      case 'closed':
        return '#6c757d';
      case 'pending':
        return '#ffc107';
      case 'accepted':
        return '#28a745';
      case 'declined':
        return '#dc3545';
      default:
        return '#6c757d';
    }
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
        <h1 style={styles.headerTitle}>📣 Help Requests</h1>
        <p style={styles.headerSubtitle}>
          Post your requests and get help from the community
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
                              disabled={updatingStatusId === response._id}
                              style={styles.acceptButton}
                            >
                              {updatingStatusId === response._id ? 'Updating...' : '✅ Accept'}
                            </button>
                            <button
                              onClick={() => handleAcceptResponse(response._id, 'declined')}
                              disabled={updatingStatusId === response._id}
                              style={styles.declineButton}
                            >
                              {updatingStatusId === response._id ? 'Updating...' : '❌ Decline'}
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

                {/* Edit/Delete Buttons */}
                {request.user_id && (canEditRequest(user, request.user_id) || canDeleteRequest(user, request.user_id)) && (
                  <div style={styles.actionButtons}>
                    {canEditRequest(user, request.user_id) && (
                      <button
                        onClick={() => handleEdit(request)}
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

      {/* Edit Request Modal */}
      {editingRequest && (
        <div style={styles.modalOverlay} onClick={() => setEditingRequest(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Request</h2>
              <button onClick={() => setEditingRequest(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Trade Needed *</label>
                <input
                  type="text"
                  value={editForm.trade_needed}
                  onChange={(e) => setEditForm({ ...editForm, trade_needed: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Budget</label>
                <input
                  type="number"
                  value={editForm.budget}
                  onChange={(e) => setEditForm({ ...editForm, budget: Number(e.target.value) || 0 })}
                  min="0"
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setEditingRequest(null)} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} style={styles.saveButton}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#333',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
    padding: 0,
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    marginBottom: '1.5rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '100px',
    boxSizing: 'border-box',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f8f9fa',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#20c997',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
};
