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
    <nav className={`bg-white shadow-md border-b border-gray-200 ${isAccessibilityMode ? 'accessibility-mode' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl md:text-3xl font-bold gradient-text whitespace-nowrap text-center">
              CommuniCare
            </Link>
          </div>
          
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

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleAccessibility} 
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-280 ease focus:outline-none focus:ring-2 focus:ring-primary-start focus:ring-offset-2"
              title={isAccessibilityMode ? 'Disable Accessibility Mode' : 'Enable Accessibility Mode'}
              aria-label={isAccessibilityMode ? 'Disable Accessibility Mode' : 'Enable Accessibility Mode'}
            >
              {isAccessibilityMode ? '♿' : '👁️'}
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
        </div>
      </div>
    </nav>
  );
};

