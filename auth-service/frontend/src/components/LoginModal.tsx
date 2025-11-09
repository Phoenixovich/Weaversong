import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      setEmail('');
      setPassword('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="overlay" onClick={handleBackdropClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="header">
          <h2 className="title">Login Required</h2>
          <button className="closeButton" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="content">
          <p className="message">
            Please log in to access this feature.
          </p>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit} className="form">
            <div className="formGroup">
              <label htmlFor="modal-email" className="label">
                Email
              </label>
              <input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="Enter your email"
              />
            </div>
            <div className="formGroup">
              <label htmlFor="modal-password" className="label">
                Password
              </label>
              <input
                id="modal-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" disabled={loading} className="button">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="linkText">
            Don't have an account? <Link to="/signup" className="link" onClick={onClose}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};


