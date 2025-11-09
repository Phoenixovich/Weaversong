import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forbidden.css';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Redirect after 3 seconds
    const redirectTimer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="forbidden-page">
      <div className="forbidden-content">
        <div className="forbidden-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Oops! Something went wrong</h2>
          <p className="error-message">
            Redirecting to welcome page in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    </div>
  );
};

