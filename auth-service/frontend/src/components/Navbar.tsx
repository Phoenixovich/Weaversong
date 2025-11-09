import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { UserBadge } from './UserBadge';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isAccessibilityMode, toggleAccessibility } = useAccessibility();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`bg-white shadow-md border-b border-gray-200 ${isAccessibilityMode ? 'accessibility-mode' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl md:text-3xl font-bold gradient-text whitespace-nowrap text-center">
              CommuniCare
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {/* Public pages - always visible */}
            <Link 
              to="/citypulse" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-280 ease ${
                isActive('/citypulse') 
                  ? 'gradient-primary text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              CityPulse
            </Link>
            {!isAccessibilityMode && (
              <Link 
                to="/public-data" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-280 ease ${
                  isActive('/public-data') 
                    ? 'gradient-primary text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                PublicData
              </Link>
            )}
            <Link 
              to="/clarifai" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-280 ease ${
                isActive('/clarifai') 
                  ? 'gradient-primary text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              ClarifAI
            </Link>
            <Link 
              to="/helpboard" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-280 ease ${
                isActive('/helpboard') 
                  ? 'gradient-primary text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Helpboard
            </Link>
            <Link 
              to="/pedestrian-analyzer" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-280 ease ${
                isActive('/pedestrian-analyzer') 
                  ? 'gradient-primary text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pedestrian Analyzer
            </Link>
            {/* Protected pages - only visible when authenticated */}
            {isAuthenticated && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-280 ease ${
                    isActive('/dashboard') 
                      ? 'gradient-primary text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/profile" 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-280 ease ${
                    isActive('/profile') 
                      ? 'gradient-primary text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Profile
                </Link>
              </>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={toggleAccessibility} 
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-280 ease focus:outline-none focus:ring-2 focus:ring-primary-start focus:ring-offset-2"
              title={isAccessibilityMode ? 'Disable Accessibility Mode' : 'Enable Accessibility Mode'}
              aria-label={isAccessibilityMode ? 'Disable Accessibility Mode' : 'Enable Accessibility Mode'}
            >
              {isAccessibilityMode ? 'ℹ️' : '👁️'}
            </button>
            {isAuthenticated && user ? (
              <>
                <UserBadge user={user} showRole={!isAccessibilityMode} size={isAccessibilityMode ? "large" : "medium"} />
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md transition-all duration-280 ease focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login" 
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-280 ease focus:outline-none focus:ring-2 focus:ring-primary-start focus:ring-offset-2"
                >
                  Login
                </Link>
                {!isAccessibilityMode && (
                  <Link 
                    to="/signup" 
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white gradient-primary shadow-md hover:shadow-lg transition-all duration-280 ease focus:outline-none focus:ring-2 focus:ring-primary-start focus:ring-offset-2"
                  >
                    SignUp
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-280 ease focus:outline-none focus:ring-2 focus:ring-primary-start focus:ring-offset-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mobile-menu">
            <div className="mobile-menu-content">
              {/* Mobile Navigation Links */}
              <div className="mobile-nav-links">
                <Link 
                  to="/citypulse" 
                  onClick={closeMobileMenu}
                  className={`mobile-nav-link ${isActive('/citypulse') ? 'active' : ''}`}
                >
                  CityPulse
                </Link>
                {!isAccessibilityMode && (
                  <Link 
                    to="/public-data" 
                    onClick={closeMobileMenu}
                    className={`mobile-nav-link ${isActive('/public-data') ? 'active' : ''}`}
                  >
                    PublicData
                  </Link>
                )}
                <Link 
                  to="/clarifai" 
                  onClick={closeMobileMenu}
                  className={`mobile-nav-link ${isActive('/clarifai') ? 'active' : ''}`}
                >
                  ClarifAI
                </Link>
                <Link 
                  to="/helpboard" 
                  onClick={closeMobileMenu}
                  className={`mobile-nav-link ${isActive('/helpboard') ? 'active' : ''}`}
                >
                  Helpboard
                </Link>
                <Link 
                  to="/pedestrian-analyzer" 
                  onClick={closeMobileMenu}
                  className={`mobile-nav-link ${isActive('/pedestrian-analyzer') ? 'active' : ''}`}
                >
                  Pedestrian Analyzer
                </Link>
                {isAuthenticated && (
                  <>
                    <Link 
                      to="/dashboard" 
                      onClick={closeMobileMenu}
                      className={`mobile-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/profile" 
                      onClick={closeMobileMenu}
                      className={`mobile-nav-link ${isActive('/profile') ? 'active' : ''}`}
                    >
                      Profile
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Actions */}
              <div className="mobile-actions">
                {isAuthenticated && user ? (
                  <>
                    <div className="mobile-user-info">
                      <UserBadge user={user} showRole={!isAccessibilityMode} size="medium" />
                    </div>
                    <button 
                      onClick={handleLogout} 
                      className="mobile-logout-button"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="mobile-auth-buttons">
                    <Link 
                      to="/login" 
                      onClick={closeMobileMenu}
                      className="mobile-login-button"
                    >
                      Login
                    </Link>
                    {!isAccessibilityMode && (
                      <Link 
                        to="/signup" 
                        onClick={closeMobileMenu}
                        className="mobile-signup-button"
                      >
                        SignUp
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

