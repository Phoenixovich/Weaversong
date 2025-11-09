import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { helpdeskAPI } from '../services/api';
import RequestForm from '../components/RequestForm';
import ResponseForm from '../components/ResponseForm';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { canEditRequest, canDeleteRequest, canAcceptResponse } from '../utils/permissions';
import './RequestsPage.css';

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
  const [editForm, setEditForm] = useState({ title: '', description: '', trade_needed: '', budget: 0, urgency: 'normal', status: 'open' });
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get<RequestItem[]>('/helpboard/requests');
      setRequests(Array.isArray(res.data) ? res.data : []);
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
      urgency: request.urgency || 'normal',
      status: request.status || 'open',
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
        urgency: editForm.urgency,
        status: editForm.status,
      });
      setEditingRequest(null);
      fetchRequests();
      alert('Request updated successfully!');
    } catch (error: any) {
      alert(`Failed to update request: ${error.message}`);
    }
  };

  const handleAcceptResponse = async (responseId: string, requestId: string, status: 'accepted' | 'declined') => {
    setUpdatingStatusId(responseId);
    try {
      await helpdeskAPI.updateResponseStatus(responseId, status);
      // If accepting a response, automatically set the request status to "accepted"
      if (status === 'accepted') {
        await helpdeskAPI.updateRequest(requestId, { status: 'accepted' });
      }
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
    if (!Array.isArray(requests)) return [];
    const request = requests.find(r => r._id === requestId);
    if (!user || !request || request.user_id !== user.id) {
      return [];
    }
    return Array.isArray(responses) ? responses.filter(r => r.request_id === requestId) : [];
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
    <div className="requests-page-wrapper">
      <div className="requests-page-container">
        <div className="requests-page-header">
          <h1 className="requests-page-title">📣 Help Requests</h1>
          <p className="requests-page-subtitle">
            Post your requests and get help from the community
          </p>
          <div className="requests-page-controls">
            <button
              onClick={() => navigate('/helpboard')}
              className="requests-page-button"
            >
              ← Back to Helpboard
            </button>
          </div>
        </div>

        <div className="requests-page-content">
          <div className="requests-page-create-section">
            <h2 className="requests-page-section-title">Create a Request</h2>
            <RequestForm onCreated={handleCreateRequest} />
          </div>

          <div className="requests-page-list-section">
            <h2 className="requests-page-section-title">All Requests ({requests.length})</h2>
            {loading ? (
              <p className="requests-page-loading">Loading requests...</p>
            ) : requests.length === 0 ? (
              <div className="requests-page-empty">
                <p>No requests yet. Be the first to create one!</p>
              </div>
            ) : (
              <div className="requests-page-grid">
                {Array.isArray(requests) ? requests.map((request) => (
                  <div key={request._id} className="requests-page-card">
                    <div className="requests-page-card-header">
                      <h3 className="requests-page-card-title">{request.title}</h3>
                      <div className="requests-page-badges">
                        {request.status && (
                          <span
                            className="requests-page-badge"
                            style={{
                              backgroundColor: getStatusColor(request.status),
                              color: 'white',
                            }}
                          >
                            {request.status}
                          </span>
                        )}
                        {request.urgency && (
                          <span
                            className="requests-page-badge"
                            style={{
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
                      <p className="requests-page-card-description">{request.description}</p>
                    )}
                    <div className="requests-page-card-details">
                      {request.trade_needed && (
                        <div className="requests-page-detail-item">
                          <strong>Trade:</strong> {request.trade_needed}
                        </div>
                      )}
                      {request.budget && (
                        <div className="requests-page-detail-item">
                          <strong>Budget:</strong> ${request.budget}
                        </div>
                      )}
                      {request.date_created && (
                        <div className="requests-page-detail-item">
                          <strong>Created:</strong>{' '}
                          {new Date(request.date_created).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {/* Responses Section */}
                    {getResponsesForRequest(request._id).length > 0 && (
                      <div className="requests-page-responses-section">
                        <h4 className="requests-page-responses-title">Responses ({getResponsesForRequest(request._id).length})</h4>
                        {Array.isArray(getResponsesForRequest(request._id)) ? getResponsesForRequest(request._id).map((response) => (
                          <div key={response._id} className="requests-page-response-item">
                            <div className="requests-page-response-header">
                              <p className="requests-page-response-message">{response.message}</p>
                              <span
                                className="requests-page-badge"
                                style={{
                                  backgroundColor: getResponseStatusColor(response.status),
                                  color: 'white',
                                }}
                              >
                                {response.status}
                              </span>
                            </div>
                            {response.date_created && (
                              <div className="requests-page-response-date">
                                {new Date(response.date_created).toLocaleString()}
                              </div>
                            )}
                            {/* Accept/Decline buttons - only for request owner */}
                            {request.user_id && canAcceptResponse(user, request.user_id) && response.status === 'pending' && (
                              <div className="requests-page-response-actions">
                                <button
                                  onClick={() => handleAcceptResponse(response._id, request._id, 'accepted')}
                                  disabled={updatingStatusId === response._id}
                                  className="requests-page-accept-button"
                                >
                                  {updatingStatusId === response._id ? 'Updating...' : '✅ Accept'}
                                </button>
                                <button
                                  onClick={() => handleAcceptResponse(response._id, request._id, 'declined')}
                                  disabled={updatingStatusId === response._id}
                                  className="requests-page-decline-button"
                                >
                                  {updatingStatusId === response._id ? 'Updating...' : '❌ Decline'}
                                </button>
                              </div>
                            )}
                          </div>
                        )) : []}
                      </div>
                    )}

                    {/* Only show response form for requests NOT owned by the user */}
                    {user && request.user_id !== user.id && (
                      <div className="requests-page-response-section">
                        <ResponseForm
                          request_id={request._id}
                          onCreated={() => {
                            fetchRequests();
                            fetchResponses();
                          }}
                        />
                      </div>
                    )}

                    {/* Quick Status Update - only for request owner */}
                    {request.user_id && canEditRequest(user, request.user_id) && (
                      <div className="requests-page-status-section">
                        <label className="requests-page-status-label">Status:</label>
                        <select
                          value={request.status || 'open'}
                          onChange={async (e) => {
                            try {
                              await helpdeskAPI.updateRequest(request._id, { status: e.target.value });
                              fetchRequests();
                            } catch (error: any) {
                              alert(`Failed to update status: ${error.message}`);
                            }
                          }}
                          className="requests-page-status-select"
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    )}

                    {/* Edit/Delete Buttons */}
                    {request.user_id && (canEditRequest(user, request.user_id) || canDeleteRequest(user, request.user_id)) && (
                      <div className="requests-page-action-buttons">
                        {canEditRequest(user, request.user_id) && (
                          <button
                            onClick={() => handleEdit(request)}
                            className="requests-page-edit-button"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        {canDeleteRequest(user, request.user_id) && (
                          <button
                            onClick={() => handleDelete(request)}
                            disabled={deletingId === request._id}
                            className="requests-page-delete-button"
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
          <div className="requests-page-modal-overlay" onClick={() => setEditingRequest(null)}>
            <div className="requests-page-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="requests-page-modal-header">
                <h2 className="requests-page-modal-title">Edit Request</h2>
                <button onClick={() => setEditingRequest(null)} className="requests-page-modal-close">✕</button>
              </div>
              <div className="requests-page-modal-body">
                <div className="requests-page-form-group">
                  <label className="requests-page-label">Title *</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                    className="requests-page-input"
                  />
                </div>
                <div className="requests-page-form-group">
                  <label className="requests-page-label">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                    className="requests-page-textarea"
                  />
                </div>
                <div className="requests-page-form-group">
                  <label className="requests-page-label">Trade Needed *</label>
                  <input
                    type="text"
                    value={editForm.trade_needed}
                    onChange={(e) => setEditForm({ ...editForm, trade_needed: e.target.value })}
                    required
                    className="requests-page-input"
                  />
                </div>
                <div className="requests-page-form-group">
                  <label className="requests-page-label">Budget</label>
                  <input
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: Number(e.target.value) || 0 })}
                    min="0"
                    className="requests-page-input"
                  />
                </div>
                <div className="requests-page-form-group">
                  <label className="requests-page-label">Urgency</label>
                  <select
                    value={editForm.urgency}
                    onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}
                    className="requests-page-select"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="requests-page-form-group">
                  <label className="requests-page-label">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="requests-page-select"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="requests-page-modal-footer">
                <button onClick={() => setEditingRequest(null)} className="requests-page-cancel-button">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} className="requests-page-save-button">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

