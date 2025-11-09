import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import './Settings.css';

export const Settings: React.FC = () => {
  const { user, setUser } = useAuth();
  const [showPremiumBadge, setShowPremiumBadge] = useState(
    user?.show_premium_badge !== false
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setShowPremiumBadge(user.show_premium_badge !== false);
    }
  }, [user]);

  const handleTogglePremiumBadge = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setShowPremiumBadge(newValue);
    
    setSaving(true);
    setMessage(null);
    
    try {
      const updatedUser = await authAPI.updatePreferences({ show_premium_badge: newValue });
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } catch (error: any) {
      console.error('Failed to update preference:', error);
      setShowPremiumBadge(!newValue); // Revert on error
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update preferences. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <p>Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-content">
        <div className="settings-header">
          <h1 className="settings-title gradient-text">Settings</h1>
          <div className="settings-nav-buttons">
            <Link to="/dashboard" className="btn-secondary">← Dashboard</Link>
            <Link to="/profile" className="btn-secondary">Profile →</Link>
          </div>
        </div>

        <div className="settings-card">
          {message && (
            <div className={`settings-message ${message.type === 'success' ? 'settings-message-success' : 'settings-message-error'}`}>
              {message.text}
            </div>
          )}

          {user.is_premium && (
            <div className="settings-section">
              <h2 className="settings-section-title">Premium Badge</h2>
              <label className="settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={showPremiumBadge}
                  onChange={handleTogglePremiumBadge}
                  disabled={saving}
                  className="settings-checkbox"
                />
                <span className="settings-checkbox-text">Show purple star (⭐) next to my username</span>
              </label>
              <p className="settings-help-text">
                You'll still have all premium features, but the badge won't be visible to others.
              </p>
            </div>
          )}

          <div className="settings-section">
            <h2 className="settings-section-title">Account Information</h2>
            <div className="settings-info-grid">
              <div className="settings-info-row">
                <strong className="settings-info-label">Role:</strong>
                <span className="settings-info-value">{user.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'User'}</span>
              </div>
              <div className="settings-info-row">
                <strong className="settings-info-label">Premium Status:</strong>
                <span className="settings-info-value">{user.is_premium ? 'Premium Member' : 'Standard Member'}</span>
              </div>
              <div className="settings-info-row">
                <strong className="settings-info-label">Email:</strong>
                <span className="settings-info-value">{user.email}</span>
              </div>
              <div className="settings-info-row">
                <strong className="settings-info-label">Username:</strong>
                <span className="settings-info-value">{user.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


