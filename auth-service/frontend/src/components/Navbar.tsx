import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isAccessibilityMode, toggleAccessibilityMode } = useAccessibility();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard"> Community Service Hub</Link>
        </div>

        <div className="navbar-links">
          <Link to="/dashboard" className={isActive('/dashboard')}>
            Dashboard
          </Link>
          <Link to="/clarifai" className={isActive('/clarifai')}>
            ClarifAI
          </Link>
          <Link to="/public-data" className={isActive('/public-data')}>
            Public Data
          </Link>
        </div>

        <div className="navbar-user">
          {user && (
            <>
              <span className="user-name">{user.name}</span>
              <button
                onClick={toggleAccessibilityMode}
                className="accessibility-toggle"
                title={isAccessibilityMode ? 'Disable Accessibility Mode' : 'Enable Accessibility Mode'}
                aria-label={isAccessibilityMode ? 'Disable Accessibility Mode' : 'Enable Accessibility Mode'}
              >
                {isAccessibilityMode ? '👁️‍🗨️' : '👁️'} {isAccessibilityMode ? 'Accessibility On' : 'Accessibility'}
              </button>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

