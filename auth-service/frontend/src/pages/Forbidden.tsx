import React from 'react';
import { Link } from 'react-router-dom';
import './Forbidden.css';

export const Forbidden: React.FC = () => {
  return (
    <div className="forbidden-page">
      <div className="forbidden-header">
        <h1 className="header-title">403</h1>
        <p className="header-subtitle">
          Access Forbidden
        </p>
      </div>

      <div className="forbidden-content">
        <div className="forbidden-container">
          <div className="error-icon">🚫</div>
          <h2 className="error-title">Access Denied</h2>
          <p className="error-message">
            You don't have permission to access this page. This resource requires special privileges or authentication.
          </p>
          <div className="error-actions">
            <Link to="/" className="home-button">
              🏠 Go to Home
            </Link>
            <Link to="/dashboard" className="dashboard-button">
              📊 Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

