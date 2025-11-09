import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="error-icon">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="error-actions">
          <Link to="/" className="home-button">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

