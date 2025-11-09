import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Welcome.css';

export const Welcome: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="container">
      <div className="hero">
        <h1 className="title">Welcome to Weaversong</h1>
        <p className="subtitle">
          Your community platform for local connections, data insights, and collaborative help
        </p>
        <div className="buttonGroup">
          {isAuthenticated ? (
            <Link to="/dashboard" className="primaryButton">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="primaryButton">
                Get Started
              </Link>
              <Link to="/signup" className="secondaryButton">
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features">
        <div className="featureCard">
          <div className="featureIcon">🏙️</div>
          <h3 className="featureTitle">City Pulse</h3>
          <p className="featureDescription">
            Explore urban data and insights about your city
          </p>
        </div>
        <div className="featureCard">
          <div className="featureIcon">💼</div>
          <h3 className="featureTitle">Helpboard</h3>
          <p className="featureDescription">
            Connect with neighbors, find local help, and offer your skills
          </p>
        </div>
        <div className="featureCard">
          <div className="featureIcon">📊</div>
          <h3 className="featureTitle">Public Data Hub</h3>
          <p className="featureDescription">
            Access and explore public datasets and resources
          </p>
        </div>
        <div className="featureCard">
          <div className="featureIcon">🤖</div>
          <h3 className="featureTitle">ClarifAI</h3>
          <p className="featureDescription">
            AI-powered tools and insights for your community
          </p>
        </div>
        <div className="featureCard">
          <div className="featureIcon">🚶</div>
          <h3 className="featureTitle">Pedestrian Analyzer</h3>
          <p className="featureDescription">
            Analyze pedestrian traffic patterns and urban mobility data
          </p>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="footer">
          <p className="footerText">
            Already have an account? <Link to="/login" className="footerLink">Log in</Link>
          </p>
        </div>
      )}
    </div>
  );
};

