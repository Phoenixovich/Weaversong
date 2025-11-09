import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { helpdeskAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { canEditResponse, canDeleteResponse } from '../utils/permissions';
import './MyResponsesPage.css';

interface ResponseItem {
  _id: string;
  request_id: string;
  responder_id: string;
  message: string;
  status: string;
  date_created?: string;
}

interface RequestItem {
  _id: string;
  title?: string;
  user_id?: string;
}

export default function MyResponsesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState<ResponseItem | null>(null);
  const [editForm, setEditForm] = useState({ message: '' });

  const fetchRequests = async () => {
    try {
      const res = await api.get<RequestItem[]>('/helpboard/requests');
      setRequests(res.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
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

  useEffect(() => {
    fetchRequests();
    fetchResponses();
  }, []);

  // Filter responses to only show those created by the current user
  const getMyResponses = () => {
    if (!user) return [];
    return responses.filter(r => r.responder_id === user.id);
  };

  const getRequestTitle = (requestId: string) => {
    const request = requests.find(r => r._id === requestId);
    return request?.title || `Request ${requestId.substring(0, 8)}...`;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return '#28a745';
      case 'declined':
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

  const handleEdit = (response: ResponseItem) => {
    setEditingResponse(response);
    setEditForm({
      message: response.message,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingResponse) return;

    try {
      await helpdeskAPI.updateResponse(editingResponse._id, {
        message: editForm.message,
      });
      setEditingResponse(null);
      fetchResponses();
      alert('Response updated successfully!');
    } catch (error: any) {
      alert(`Failed to update response: ${error.message}`);
    }
  };

  const myResponses = getMyResponses();

  return (
    <div className="helpboard-page">
      <div className="header">
        <h1 className="headerTitle">💬 My Responses</h1>
        <p className="headerSubtitle">
          View and manage all responses you've created
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
        <div className="statsBar">
          <div className="statItem">
            <strong>Total Responses:</strong> {myResponses.length}
          </div>
          <div className="statItem">
            <strong>Pending:</strong>{' '}
            {myResponses.filter((r) => r.status === 'pending').length}
          </div>
          <div className="statItem">
            <strong>Accepted:</strong>{' '}
            {myResponses.filter((r) => r.status === 'accepted').length}
          </div>
          <div className="statItem">
            <strong>Declined:</strong>{' '}
            {myResponses.filter((r) => r.status === 'declined').length}
          </div>
        </div>

        {loading ? (
          <p className="loading">Loading responses...</p>
        ) : !user ? (
          <div className="emptyState">
            <p>Please log in to see your responses.</p>
          </div>
        ) : myResponses.length === 0 ? (
          <div className="emptyState">
            <p>You haven't created any responses yet.</p>
          </div>
        ) : (
          <div className="responsesList">
            {myResponses.map((response) => (
              <div key={response._id} className="responseCard">
                <div className="responseHeader">
                  <div className="responseInfo">
                    <strong>Request:</strong> {getRequestTitle(response.request_id)}
                  </div>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: getStatusColor(response.status),
                      color: 'white',
                    }}
                  >
                    {response.status}
                  </span>
                </div>
                <div className="responseBody">
                  <p className="responseMessage">{response.message}</p>
                  <div className="responseMeta">
                    {response.date_created && (
                      <div className="metaItem">
                        <strong>Date:</strong>{' '}
                        {new Date(response.date_created).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Edit/Delete Buttons */}
                  {response.responder_id && (canEditResponse(user, response.responder_id) || canDeleteResponse(user, response.responder_id)) && (
                    <div className="actionButtons">
                      {canEditResponse(user, response.responder_id) && (
                        <button
                          onClick={() => handleEdit(response)}
                          className="editButton"
                        >
                          ✏️ Edit
                        </button>
                      )}
                      {canDeleteResponse(user, response.responder_id) && (
                        <button
                          onClick={() => handleDelete(response)}
                          disabled={deletingId === response._id}
                          className="deleteButton"
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

      {/* Edit Response Modal */}
      {editingResponse && (
        <div className="modalOverlay" onClick={() => setEditingResponse(null)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Edit Response</h2>
              <button onClick={() => setEditingResponse(null)} className="modalClose">✕</button>
            </div>
            <div className="modalBody">
              <div className="formGroup">
                <label className="label">Message *</label>
                <textarea
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  rows={6}
                  required
                  className="textarea"
                  placeholder="Enter your response message..."
                />
              </div>
            </div>
            <div className="modalFooter">
              <button onClick={() => setEditingResponse(null)} className="cancelButton">
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

