import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { helpdeskAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { canEditRequest, canDeleteRequest, canAcceptResponse } from '../utils/permissions';
import './MyRequestsPage.css';

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

export default function MyRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<RequestItem | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', trade_needed: '', budget: 0, urgency: 'normal', status: 'open' });
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
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

  // Filter requests to only show those created by the current user
  const getMyRequests = () => {
    if (!user) return [];
    return requests.filter(r => r.user_id === user.id);
  };

  const getResponsesForRequest = (requestId: string) => {
    return responses.filter(r => r.request_id === requestId);
  };

  const toggleResponses = (requestId: string) => {
    const newExpanded = new Set(expandedResponses);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedResponses(newExpanded);
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return '#28a745';
      case 'closed':
        return '#6c757d';
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
      case 'normal':
        return '#17a2b8';
      case 'low':
        return '#28a745';
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
      fetchRequests();
    } catch (error: any) {
      alert(`Failed to ${status === 'accepted' ? 'accept' : 'decline'} response: ${error.message}`);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const myRequests = getMyRequests();

  return (
    <div className="helpboard-page">
      <div className="header">
        <h1 className="headerTitle">📋 My Requests</h1>
        <p className="headerSubtitle">
          View and manage all your help requests
        </p>
        <div className="controlsRow">
          <button
            onClick={() => navigate('/helpboard')}
            className="tabButton"
          >
            ← Back to Helpboard
          </button>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <p className="loading">Loading requests...</p>
        ) : !user ? (
          <div className="emptyState">
            <p>Please log in to see your requests.</p>
          </div>
        ) : myRequests.length === 0 ? (
          <div className="emptyState">
            <p>You haven't created any requests yet.</p>
          </div>
        ) : (
          <div className="requestsList">
            {myRequests.map((request) => (
              <div key={request._id} className="requestCard">
                <div className="requestHeader">
                  <h3 className="requestTitle">{request.title}</h3>
                  <div className="badges">
                    {request.status && (
                      <span
                        className="badge"
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
                        className="badge"
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
                  <p className="requestDescription">{request.description}</p>
                )}
                <div className="requestDetails">
                  {request.trade_needed && (
                    <div className="detailItem">
                      <strong>Trade:</strong> {request.trade_needed}
                    </div>
                  )}
                  {request.budget !== undefined && request.budget > 0 && (
                    <div className="detailItem">
                      <strong>Budget:</strong> ${request.budget}
                    </div>
                  )}
                  {request.date_created && (
                    <div className="detailItem">
                      <strong>Created:</strong> {new Date(request.date_created).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Quick Status Update */}
                {request.user_id && canEditRequest(user, request.user_id) && (
                  <div className="statusUpdateSection">
                    <label className="statusLabel">Status:</label>
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
                      className="statusSelect"
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                )}

                {/* Show responses button */}
                {user && (
                  <button
                    onClick={() => toggleResponses(request._id)}
                    className="expandButton"
                  >
                    {expandedResponses.has(request._id) ? '▼ Hide Responses' : '▶ View Responses'}
                  </button>
                )}

                {/* Display responses when expanded */}
                {expandedResponses.has(request._id) && user && (
                  <div className="responsesSection">
                    {getResponsesForRequest(request._id).length > 0 ? (
                      <>
                        <h4 className="responsesTitle">Responses ({getResponsesForRequest(request._id).length})</h4>
                        {getResponsesForRequest(request._id).map((response) => (
                          <div key={response._id} className="responseItem">
                            <div className="responseHeader">
                              <p className="responseMessage">{response.message}</p>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: getResponseStatusColor(response.status),
                                  color: 'white',
                                }}
                              >
                                {response.status}
                              </span>
                            </div>
                            {response.date_created && (
                              <div className="responseDate">
                                {new Date(response.date_created).toLocaleString()}
                              </div>
                            )}
                            {/* Accept/Decline buttons */}
                            {request.user_id && canAcceptResponse(user, request.user_id) && response.status === 'pending' && (
                              <div className="responseActions">
                                <button
                                  onClick={() => handleAcceptResponse(response._id, request._id, 'accepted')}
                                  disabled={updatingStatusId === response._id}
                                  className="acceptButton"
                                >
                                  {updatingStatusId === response._id ? 'Updating...' : '✅ Accept'}
                                </button>
                                <button
                                  onClick={() => handleAcceptResponse(response._id, request._id, 'declined')}
                                  disabled={updatingStatusId === response._id}
                                  className="declineButton"
                                >
                                  {updatingStatusId === response._id ? 'Updating...' : '❌ Decline'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="emptyResponse">No responses yet.</p>
                    )}
                  </div>
                )}

                {/* Edit/Delete Buttons */}
                {request.user_id && (canEditRequest(user, request.user_id) || canDeleteRequest(user, request.user_id)) && (
                  <div className="actionButtons">
                    {canEditRequest(user, request.user_id) && (
                      <button
                        onClick={() => handleEdit(request)}
                        className="editButton"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {canDeleteRequest(user, request.user_id) && (
                      <button
                        onClick={() => handleDelete(request)}
                        disabled={deletingId === request._id}
                        className="deleteButton"
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

      {/* Edit Request Modal */}
      {editingRequest && (
        <div className="modalOverlay" onClick={() => setEditingRequest(null)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Edit Request</h2>
              <button onClick={() => setEditingRequest(null)} className="modalClose">✕</button>
            </div>
            <div className="modalBody">
              <div className="formGroup">
                <label className="label">Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div className="formGroup">
                <label className="label">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="textarea"
                />
              </div>
              <div className="formGroup">
                <label className="label">Trade Needed</label>
                <input
                  type="text"
                  value={editForm.trade_needed}
                  onChange={(e) => setEditForm({ ...editForm, trade_needed: e.target.value })}
                  className="input"
                />
              </div>
              <div className="formGroup">
                <label className="label">Budget</label>
                <input
                  type="number"
                  value={editForm.budget}
                  onChange={(e) => setEditForm({ ...editForm, budget: Number(e.target.value) })}
                  min="0"
                  className="input"
                />
              </div>
              <div className="formGroup">
                <label className="label">Urgency</label>
                <select
                  value={editForm.urgency}
                  onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}
                  className="select"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="formGroup">
                <label className="label">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="select"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="modalFooter">
              <button onClick={() => setEditingRequest(null)} className="cancelButton">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="saveButton">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

