import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserBadge } from './UserBadge';
import { UserRole } from '../types/auth';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
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
          <Link to="/citypulse"> Community Service Hub</Link>
        </div>
        
        <div className="navbar-links">
          {/* Public pages - always visible */}
          <Link to="/citypulse" className={isActive('/citypulse')}>
            CityPulse
          </Link>
          <Link to="/public-data" className={isActive('/public-data')}>
            Public Data
          </Link>
          <Link to="/clarifai" className={isActive('/clarifai')}>
            ClarifAI
          </Link>
          <Link to="/helpboard" className={isActive('/helpboard')}>
            Helpboard
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
              {/* Premium/Admin features */}
              {(user?.is_premium || user?.role === UserRole.ADMIN) && (
                <Link to="/pedestrian-analyzer" className={isActive('/pedestrian-analyzer')}>
                  🚶 Pedestrian Analyzer
                </Link>
              )}
            </>
          )}
        </div>

        <div className="navbar-user">
          {isAuthenticated && user ? (
            <>
              <UserBadge user={user} showRole={true} size="medium" />
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </>
          ) : (
            <div className="navbar-auth-buttons">
              <Link to="/login" className="login-button">
                Login
              </Link>
              <Link to="/signup" className="signup-button">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

