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
    return Array.isArray(allRequests) ? allRequests.filter((r) => r.status !== 'closed') : [];
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
    <div className="helpboard-landing-page">
      <div className="helpboard-landing-container">
        <header className="helpboard-landing-header">
          <h1 className="helpboard-landing-title">
            💼 Helpboard
          </h1>
          <p className="helpboard-landing-subtitle">
            Find local help, post requests, and connect with skilled neighbours.
          </p>
          <div className="helpboard-landing-controls">
            <button
              onClick={() => setShowRequestForm((s) => !s)}
              className={`helpboard-landing-button ${showRequestForm ? 'helpboard-landing-button-active' : ''}`}
            >
              {showRequestForm ? '✕ Close Form' : '+ Submit Request'}
            </button>
            {user && (
              <>
                <Link to="/helpboard/my-trades" className="helpboard-landing-button">
                  👷 My Trades
                </Link>
                <Link to="/helpboard/my-requests" className="helpboard-landing-button">
                  📋 My Requests
                </Link>
                <Link to="/helpboard/my-responses" className="helpboard-landing-button">
                  💬 My Responses
                </Link>
              </>
            )}
            <Link to="/helpboard/requests" className="helpboard-landing-button">
              📣 All Requests
            </Link>
          </div>
        </header>

        <div className="helpboard-landing-content">
          {error && (
            <div className="helpboard-landing-error">
              ⚠️ {error}
            </div>
          )}

          {showRequestForm && (
            <div className="helpboard-landing-form-section">
              <RequestForm onCreated={() => { setShowRequestForm(false); fetchAll(); }} />
            </div>
          )}

          <div className="helpboard-landing-requests-section">
            <h2 className="helpboard-landing-section-title">📋 Active Requests</h2>
            {loading ? (
              <div className="helpboard-landing-loading">
                <p>Loading requests…</p>
              </div>
            ) : getActiveRequests().length === 0 ? (
              <div className="helpboard-landing-empty">
                <p>No active requests at the moment.</p>
                {user && (
                  <p className="helpboard-landing-empty-hint">Create one using the form above!</p>
                )}
              </div>
            ) : (
              <div className="helpboard-landing-requests-list">
                {getActiveRequests().map((r) => (
                  <div key={r._id} className="helpboard-landing-request-card">
                    <div className="helpboard-landing-request-header">
                      <h3 className="helpboard-landing-request-title">{r.title}</h3>
                      <div className="helpboard-landing-badges">
                        {r.status && (
                          <span
                            className="helpboard-landing-badge"
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
                            className="helpboard-landing-badge"
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
                      <p className="helpboard-landing-request-description">{r.description}</p>
                    )}
                    <div className="helpboard-landing-request-details">
                      {r.trade_needed && (
                        <div className="helpboard-landing-detail-item">
                          <strong>Trade:</strong> {r.trade_needed}
                        </div>
                      )}
                      {r.budget !== undefined && r.budget > 0 && (
                        <div className="helpboard-landing-detail-item">
                          <strong>Budget:</strong> ${r.budget}
                        </div>
                      )}
                      {r.date_created && (
                        <div className="helpboard-landing-detail-item">
                          <strong>Created:</strong> {new Date(r.date_created).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {/* Only show response form for requests NOT owned by the user */}
                    {user && r.user_id !== user.id && (
                      <button
                        onClick={() => toggleRequest(r._id)}
                        className="helpboard-landing-expand-button"
                      >
                        {expandedRequests.has(r._id) ? '▼ Hide Response Form' : '▶ Add Response'}
                      </button>
                    )}
                    {expandedRequests.has(r._id) && user && r.user_id !== user.id && (
                      <div className="helpboard-landing-response-section">
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
