import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

export const NotFound: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-header">
        <h1 className="header-title">404</h1>
        <p className="header-subtitle">
          Page Not Found
        </p>
      </div>

      <div className="not-found-content">
        <div className="not-found-container">
          <div className="error-icon">🔍</div>
          <h2 className="error-title">Oops! Page Not Found</h2>
          <p className="error-message">
            The page you're looking for doesn't exist or has been moved.
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

