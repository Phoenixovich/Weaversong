import React, { useState, useEffect } from 'react';
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
    <div className="container">
      <div className="card">
        <h1 className="title">Settings</h1>
        
        {message && (
          <div className={message.type === 'success' ? 'successMessage' : 'errorMessage'}>
            {message.text}
          </div>
        )}

        {user.is_premium && (
          <div className="section">
            <h2 className="sectionTitle">Premium Badge</h2>
            <label className="checkboxLabel">
              <input
                type="checkbox"
                checked={showPremiumBadge}
                onChange={handleTogglePremiumBadge}
                disabled={saving}
                className="checkbox"
              />
              <span>Show purple star (⭐) next to my username</span>
            </label>
            <p className="helpText">
              You'll still have all premium features, but the badge won't be visible to others.
            </p>
          </div>
        )}

        <div className="section">
          <h2 className="sectionTitle">Account Information</h2>
          <div className="infoRow">
            <strong>Role:</strong>
            <span>{user.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'User'}</span>
          </div>
          <div className="infoRow">
            <strong>Premium Status:</strong>
            <span>{user.is_premium ? 'Premium Member' : 'Standard Member'}</span>
          </div>
          <div className="infoRow">
            <strong>Email:</strong>
            <span>{user.email}</span>
          </div>
          <div className="infoRow">
            <strong>Username:</strong>
            <span>{user.username}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


