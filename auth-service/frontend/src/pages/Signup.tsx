import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Signup.css';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validatePasswordStrength = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    // Check for spaces
    if (/\s/.test(pwd)) {
      return 'Password cannot contain spaces';
    }
    // Check that password only contains English letters, numbers, and special characters
    if (!/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(pwd)) {
      return 'Password can only contain English letters, numbers, and special characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/[^A-Za-z0-9]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password strength before submitting
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      await signup({ email, username, name, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        <div className="signup-card">
          <h1 className="signup-title gradient-text">Sign Up</h1>
          {error && <div className="signup-error">{error}</div>}
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="signup-form-group">
              <label htmlFor="email" className="signup-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="signup-input"
                placeholder="Enter your email"
              />
            </div>
            <div className="signup-form-group">
              <label htmlFor="username" className="signup-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="signup-input"
                placeholder="Choose a username"
              />
            </div>
            <div className="signup-form-group">
              <label htmlFor="name" className="signup-label">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="signup-input"
                placeholder="Enter your full name"
              />
            </div>
            <div className="signup-form-group">
              <label htmlFor="password" className="signup-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  // Only allow English letters, numbers, and special characters (no spaces)
                  const value = e.target.value.replace(/[^A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');
                  setPassword(value);
                }}
                required
                className="signup-input"
                placeholder="Choose a password"
              />
            </div>
            <button type="submit" disabled={loading} className="signup-button btn-primary">
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
          <p className="signup-link-text">
            Already have an account? <Link to="/login" className="signup-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};


