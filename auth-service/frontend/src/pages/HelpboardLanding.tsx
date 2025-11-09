import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import RequestForm from '../components/RequestForm';
import ResponseForm from '../components/ResponseForm';
import './HelpboardLanding.css';

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


const HelpboardLanding: React.FC = () => {
  const { user } = useAuth();
  const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<RequestItem[]>('/helpboard/requests');
      setAllRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load requests', err);
      setError('Failed to load helpboard requests.');
    } finally {
      setLoading(false);
    }
  };

  // Get active requests (not closed)
  const getActiveRequests = () => {
    return allRequests.filter((r) => r.status !== 'closed');
  };


  useEffect(() => {
    fetchAll();
  }, []);


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

  const toggleRequest = (requestId: string) => {
    setExpandedRequests((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  };

  const handleResponseCreated = (requestId: string) => {
    fetchAll();
    setExpandedRequests((prev) => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  };


  return (
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            💼 Helpboard
          </h1>
          <p className="text-xl text-gray-600">
            Find local help, post requests, and connect with skilled neighbours.
          </p>
          <div className="controlsRow mt-4">
            <button
              onClick={() => setShowRequestForm((s) => !s)}
              className={`tabButton ${showRequestForm ? 'tabButtonActive' : ''}`}
            >
              {showRequestForm ? '✕ Close Form' : '+ Submit Request'}
            </button>
            {user && (
              <>
                <Link to="/helpboard/my-trades" className="tabButton">
                  👷 My Trades
                </Link>
                <Link to="/helpboard/my-requests" className="tabButton">
                  📋 My Requests
                </Link>
                <Link to="/helpboard/my-responses" className="tabButton">
                  💬 My Responses
                </Link>
              </>
            )}
            <Link to="/helpboard/requests" className="tabButton">
              📣 All Requests
            </Link>
          </div>
        </header>

        <div className="content">
          {error && (
            <div className="errorBanner">
              ⚠️ {error}
            </div>
          )}

          {showRequestForm && (
            <div className="formSection">
              <RequestForm onCreated={() => { setShowRequestForm(false); fetchAll(); }} />
            </div>
          )}

          <div className="requestsSection">
            <h2 className="sectionTitle">📋 Active Requests</h2>
            {loading ? (
              <div className="loading">
                <p>Loading requests…</p>
              </div>
            ) : getActiveRequests().length === 0 ? (
              <div className="emptyState">
                <p>No active requests at the moment.</p>
                {user && (
                  <p className="emptyHint">Create one using the form above!</p>
                )}
              </div>
            ) : (
              <div className="requestsList">
                {getActiveRequests().map((r) => (
                  <div key={r._id} className="requestCard">
                    <div className="requestHeader">
                      <h3 className="requestTitle">{r.title}</h3>
                      <div className="badges">
                        {r.status && (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: getStatusColor(r.status),
                              color: 'white',
                            }}
                          >
                            {r.status}
                          </span>
                        )}
                        {r.urgency && (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: getUrgencyColor(r.urgency),
                              color: 'white',
                            }}
                          >
                            {r.urgency}
                          </span>
                        )}
                      </div>
                    </div>
                    {r.description && (
                      <p className="requestDescription">{r.description}</p>
                    )}
                    <div className="requestDetails">
                      {r.trade_needed && (
                        <div className="detailItem">
                          <strong>Trade:</strong> {r.trade_needed}
                        </div>
                      )}
                      {r.budget !== undefined && r.budget > 0 && (
                        <div className="detailItem">
                          <strong>Budget:</strong> ${r.budget}
                        </div>
                      )}
                      {r.date_created && (
                        <div className="detailItem">
                          <strong>Created:</strong> {new Date(r.date_created).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {/* Only show response form for requests NOT owned by the user */}
                    {user && r.user_id !== user.id && (
                      <button
                        onClick={() => toggleRequest(r._id)}
                        className="expandButton"
                      >
                        {expandedRequests.has(r._id) ? '▼ Hide Response Form' : '▶ Add Response'}
                      </button>
                    )}
                    {expandedRequests.has(r._id) && user && r.user_id !== user.id && (
                      <div className="responseSection">
                        <ResponseForm
                          request_id={r._id}
                          onCreated={() => handleResponseCreated(r._id)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpboardLanding;
