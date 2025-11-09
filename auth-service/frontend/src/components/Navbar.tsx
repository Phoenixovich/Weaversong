import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { UserBadge } from './UserBadge';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isAccessibilityMode, toggleAccessibility } = useAccessibility();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className={`navbar ${isAccessibilityMode ? 'accessibility-mode' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/"> Community Service Hub</Link>
        </div>
        
        <div className="navbar-links">
          {/* Public pages - always visible */}
          <Link to="/citypulse" className={isActive('/citypulse')}>
            CityPulse
          </Link>
          {!isAccessibilityMode && (
            <Link to="/public-data" className={isActive('/public-data')}>
              PublicData
            </Link>
          )}
          <Link to="/clarifai" className={isActive('/clarifai')}>
            ClarifAI
          </Link>
          <Link to="/helpboard" className={isActive('/helpboard')}>
            Helpboard
          </Link>
          <Link to="/pedestrian-analyzer" className={isActive('/pedestrian-analyzer')}>
            Pedestrian Analyzer
          </Link>
          {/* Protected pages - only visible when authenticated */}
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className={isActive('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/profile" className={isActive('/profile')}>
                Profile
              </Link>
            </>
          )}
        </div>

        <div className="navbar-user">
          <button 
            onClick={toggleAccessibility} 
            className="accessibility-toggle"
            title={isAccessibilityMode ? 'Disable Accessibility Mode' : 'Enable Accessibility Mode'}
            aria-label={isAccessibilityMode ? 'Disable Accessibility Mode' : 'Enable Accessibility Mode'}
          >
            {isAccessibilityMode ? '♿' : '👁️'}
          </button>
          {isAuthenticated && user ? (
            <>
              <UserBadge user={user} showRole={!isAccessibilityMode} size={isAccessibilityMode ? "large" : "medium"} />
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </>
          ) : (
            <div className="navbar-auth-buttons">
              <Link to="/login" className="login-button">
                Login
              </Link>
              {!isAccessibilityMode && (
                <Link to="/signup" className="signup-button">
                  SignUp
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

