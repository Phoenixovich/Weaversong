import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import api, { helpdeskAPI } from '../services/api';
import RequestForm from '../components/RequestForm';
import ResponseForm from '../components/ResponseForm';
import { UserBadge } from '../components/UserBadge';
import { canAcceptResponse } from '../utils/permissions';
import './HelpboardPage.css';

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

  const handleAcceptResponse = async (responseId: string, requestId: string, status: 'accepted' | 'declined') => {
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
    <div className="helpboard-page-wrapper">
      <div className="helpboard-page-container">
        <header className="helpboard-page-header">
          <h1 className="helpboard-page-title">
            💼 Helpboard
          </h1>
          <p className="helpboard-page-subtitle">
            Connect with local helpers and offer your services
          </p>
          <div className="helpboard-page-controls">
          <div className="helpboard-page-tab-selector">
            <button
              className={`helpboard-page-tab-button ${activeTab === 'requests' ? 'helpboard-page-tab-button-active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              📣 Requests ({requests.length})
            </button>
            <button
              className={`helpboard-page-tab-button ${activeTab === 'responses' ? 'helpboard-page-tab-button-active' : ''}`}
              onClick={() => setActiveTab('responses')}
            >
              💬 Responses ({responses.length})
            </button>
          </div>
        </div>
        </header>

        <div className="helpboard-page-content">
        {activeTab === 'requests' && (
          <div>
            <div className="helpboard-page-create-section">
            <h2 className="helpboard-page-section-title">Create a Request</h2>
            <RequestForm onCreated={handleCreateRequest} />
          </div>

          <div className="helpboard-page-list-section">
            <h2 className="helpboard-page-section-title">All Requests</h2>
            {loading ? (
              <p className="helpboard-page-loading">Loading requests...</p>
            ) : requests.length === 0 ? (
              <div className="helpboard-page-empty">
                <p>No requests yet. Be the first to create one!</p>
              </div>
            ) : (
              <div className="helpboard-page-requests-grid">
                {requests.map((request) => (
                  <div key={request._id} className="helpboard-page-request-card">
                    <div className="helpboard-page-request-header">
                      <h3 className="helpboard-page-request-title">{request.title}</h3>
                      <div className="helpboard-page-badges">
                        {request.status && (
                          <span
                            className="helpboard-page-badge"
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
                            className="helpboard-page-badge"
                            style={{
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
                      <p className="helpboard-page-request-description">{request.description}</p>
                    )}
                    <div className="helpboard-page-request-details">
                      {request.trade_needed && (
                        <div className="helpboard-page-detail-item">
                          <strong>Trade:</strong> {request.trade_needed}
                        </div>
                      )}
                      {request.budget && (
                        <div className="helpboard-page-detail-item">
                          <strong>Budget:</strong> ${request.budget}
                        </div>
                      )}
                      {request.date_created && (
                        <div className="helpboard-page-detail-item">
                          <strong>Created:</strong>{' '}
                          {new Date(request.date_created).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {/* Responses Section */}
                    {getResponsesForRequest(request._id).length > 0 && (
                      <div className="helpboard-page-responses-section">
                        <h4 className="helpboard-page-responses-title">Responses ({getResponsesForRequest(request._id).length})</h4>
                        {getResponsesForRequest(request._id).map((response) => (
                          <div key={response._id} className="helpboard-page-response-item">
                            <div className="helpboard-page-response-header">
                              <p className="helpboard-page-response-message">{response.message}</p>
                              <span
                                className="helpboard-page-badge"
                                style={{
                                  backgroundColor: getResponseStatusColor(response.status),
                                  color: 'white',
                                }}
                              >
                                {response.status}
                              </span>
                            </div>
                            {response.date_created && (
                              <div className="helpboard-page-response-date">
                                {new Date(response.date_created).toLocaleString()}
                              </div>
                            )}
                            {/* Accept/Decline buttons - only for request owner */}
                            {request.user_id && canAcceptResponse(user, request.user_id) && response.status === 'pending' && (
                              <div className="helpboard-page-response-actions">
                                <button
                                  onClick={() => handleAcceptResponse(response._id, request._id, 'accepted')}
                                  className="helpboard-page-accept-button"
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  onClick={() => handleAcceptResponse(response._id, request._id, 'declined')}
                                  className="helpboard-page-decline-button"
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
                      <div className="helpboard-page-response-section">
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
            <h2 className="helpboard-page-section-title">All Responses</h2>
          {loading ? (
            <p className="helpboard-page-loading">Loading responses...</p>
          ) : !user ? (
            <div className="helpboard-page-empty">
              <p>Please log in to see responses to your requests.</p>
            </div>
          ) : (() => {
            const userRequestIds = new Set(
              requests.filter(r => r.user_id === user.id).map(r => r._id)
            );
            const filteredResponses = responses.filter(r => userRequestIds.has(r.request_id));
            return filteredResponses.length === 0 ? (
              <div className="helpboard-page-empty">
                <p>No responses to your requests yet.</p>
              </div>
            ) : (
              <div className="helpboard-page-responses-list">
                {filteredResponses.map((response) => (
                <div key={response._id} className="helpboard-page-response-card">
                  <div className="helpboard-page-response-header">
                    <div className="helpboard-page-response-info">
                      <strong>Response to Request:</strong> {response.request_id}
                    </div>
                    <span
                      className="helpboard-page-badge"
                      style={{
                        backgroundColor: getStatusColor(response.status),
                        color: 'white',
                      }}
                    >
                      {response.status}
                    </span>
                  </div>
                  <p className="helpboard-page-response-message">{response.message}</p>
                  {response.date_created && (
                    <div className="helpboard-page-response-date">
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
    </div>
  );
}
