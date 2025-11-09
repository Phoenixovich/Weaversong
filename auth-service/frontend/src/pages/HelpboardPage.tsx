import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import api, { helpdeskAPI } from '../services/api';
import RequestForm from '../components/RequestForm';
import ResponseForm from '../components/ResponseForm';
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
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setRequests([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await api.get<ResponseItem[]>('/helpboard/responses');
      setResponses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
      setResponses([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = () => {
    requireAuth(() => {
      fetchRequests();
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
    if (!Array.isArray(requests)) return [];
    const request = requests.find(r => r._id === requestId);
    if (!user || !request || request.user_id !== user.id) {
      return [];
    }
    return Array.isArray(responses) ? responses.filter(r => r.request_id === requestId) : [];
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
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            💼 Helpboard
          </h1>
          <p className="text-xl text-gray-600">
            Connect with local helpers and offer your services
          </p>
          <div className="controlsRow mt-4">
          <div className="tabSelector">
            <button
              className={`tabButton ${activeTab === 'requests' ? 'tabButtonActive' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              📣 Requests ({requests.length})
            </button>
            <button
              className={`tabButton ${activeTab === 'responses' ? 'tabButtonActive' : ''}`}
              onClick={() => setActiveTab('responses')}
            >
              💬 Responses ({responses.length})
            </button>
          </div>
        </div>
        </header>

        <div className="content">
        {activeTab === 'requests' && (
          <div>
            <div className="createSection">
            <h2 className="sectionTitle">Create a Request</h2>
            <RequestForm onCreated={handleCreateRequest} />
          </div>

          <div className="listSection">
            <h2 className="sectionTitle">All Requests</h2>
            {loading ? (
              <p className="loading">Loading requests...</p>
            ) : requests.length === 0 ? (
              <div className="emptyState">
                <p>No requests yet. Be the first to create one!</p>
              </div>
            ) : (
              <div className="requestsGrid">
                {Array.isArray(requests) ? requests.map((request) => (
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
                            {request.urgency} urgency
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
                      {request.budget && (
                        <div className="detailItem">
                          <strong>Budget:</strong> ${request.budget}
                        </div>
                      )}
                      {request.date_created && (
                        <div className="detailItem">
                          <strong>Created:</strong>{' '}
                          {new Date(request.date_created).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {/* Responses Section */}
                    {getResponsesForRequest(request._id).length > 0 && (
                      <div className="responsesSection">
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
                            {/* Accept/Decline buttons - only for request owner */}
                            {request.user_id && canAcceptResponse(user, request.user_id) && response.status === 'pending' && (
                              <div className="responseActions">
                                <button
                                  onClick={() => handleAcceptResponse(response._id, request._id, 'accepted')}
                                  className="acceptButton"
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  onClick={() => handleAcceptResponse(response._id, request._id, 'declined')}
                                  className="declineButton"
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
                      <div className="responseSection">
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
                )) : []}
              </div>
            )}
          </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div>
            <h2 className="sectionTitle">All Responses</h2>
          {loading ? (
            <p className="loading">Loading responses...</p>
          ) : !user ? (
            <div className="emptyState">
              <p>Please log in to see responses to your requests.</p>
            </div>
          ) : (() => {
            const userRequestIds = new Set(
              Array.isArray(requests) ? requests.filter(r => r.user_id === user.id).map(r => r._id) : []
            );
            const filteredResponses = responses.filter(r => userRequestIds.has(r.request_id));
            return filteredResponses.length === 0 ? (
              <div className="emptyState">
                <p>No responses to your requests yet.</p>
              </div>
            ) : (
              <div className="responsesList">
                {Array.isArray(filteredResponses) ? filteredResponses.map((response) => (
                <div key={response._id} className="responseCard">
                  <div className="responseHeader">
                    <div className="responseInfo">
                      <strong>Response to Request:</strong> {response.request_id}
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
                  <p className="responseMessage">{response.message}</p>
                  {response.date_created && (
                    <div className="responseDate">
                      {new Date(response.date_created).toLocaleString()}
                    </div>
                  )}
                </div>
              )) : []}
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
