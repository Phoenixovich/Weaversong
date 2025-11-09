import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

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
      <div style={styles.container}>
        <p>Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Settings</h1>
        
        {message && (
          <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
            {message.text}
          </div>
        )}

        {user.is_premium && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Premium Badge</h2>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showPremiumBadge}
                onChange={handleTogglePremiumBadge}
                disabled={saving}
                style={styles.checkbox}
              />
              <span>Show purple star (⭐) next to my username</span>
            </label>
            <p style={styles.helpText}>
              You'll still have all premium features, but the badge won't be visible to others.
            </p>
          </div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Account Information</h2>
          <div style={styles.infoRow}>
            <strong>Role:</strong>
            <span>{user.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'User'}</span>
          </div>
          <div style={styles.infoRow}>
            <strong>Premium Status:</strong>
            <span>{user.is_premium ? 'Premium Member' : 'Standard Member'}</span>
          </div>
          <div style={styles.infoRow}>
            <strong>Email:</strong>
            <span>{user.email}</span>
          </div>
          <div style={styles.infoRow}>
            <strong>Username:</strong>
            <span>{user.username}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  title: {
    marginBottom: '2rem',
    color: '#333',
  },
  section: {
    marginBottom: '2rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid #e0e0e0',
  },
  sectionTitle: {
    marginBottom: '1rem',
    color: '#333',
    fontSize: '1.2rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#333',
  },
  checkbox: {
    width: '1.25rem',
    height: '1.25rem',
    cursor: 'pointer',
  },
  helpText: {
    marginTop: '0.5rem',
    color: '#666',
    fontSize: '0.9rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid #f0f0f0',
  },
  successMessage: {
    padding: '0.75rem',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  errorMessage: {
    padding: '0.75rem',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
};

