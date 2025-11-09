import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Welcome.css';

export const Welcome: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
            Welcome to CommuniCare
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your community platform for local connections, data insights, and collaborative help
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-primary">
                  Get Started
                </Link>
                <Link to="/signup" className="btn-secondary">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          <div className="card card-hover text-center">
            <div className="text-5xl mb-4">🏙️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">City Pulse</h3>
            <p className="text-gray-600">
              Explore urban data and insights about your city
            </p>
          </div>
          <div className="card card-hover text-center">
            <div className="text-5xl mb-4">💼</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Helpboard</h3>
            <p className="text-gray-600">
              Connect with neighbors, find local help, and offer your skills
            </p>
          </div>
          <div className="card card-hover text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Public Data Hub</h3>
            <p className="text-gray-600">
              Access and explore public datasets and resources
            </p>
          </div>
          <div className="card card-hover text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ClarifAI</h3>
            <p className="text-gray-600">
              AI-powered tools and insights for your community
            </p>
          </div>
          <div className="card card-hover text-center">
            <div className="text-5xl mb-4">🚶</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pedestrian Analyzer</h3>
            <p className="text-gray-600">
              Analyze pedestrian traffic patterns and urban mobility data
            </p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account? <Link to="/login" className="text-primary-start font-semibold hover:text-primary-end transition-colors duration-280">Log in</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

