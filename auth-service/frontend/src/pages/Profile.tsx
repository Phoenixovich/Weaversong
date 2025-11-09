import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { UserBadge } from '../components/UserBadge';
import { Link } from 'react-router-dom';
import './Profile.css';

interface UserStats {
  alerts: number;
  requests: number;
  responses: number;
  reminders: number;
  total: number;
}

export const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState({
    username: '',
    default_phone: '',
    default_other_contact: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadStats();
      setEditingProfile({
        username: user.username || '',
        default_phone: user.default_phone || '',
        default_other_contact: user.default_other_contact || ''
      });
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userStats = await authAPI.getUserStats();
      setStats(userStats);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to load statistics. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;
    
    setUpgrading(true);
    setMessage(null);
    
    try {
      const updatedUser = await authAPI.upgradeToPremium();
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMessage({ 
        type: 'success', 
        text: 'Successfully upgraded to Premium! 🎉' 
      });
    } catch (error: any) {
      console.error('Failed to upgrade:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to upgrade. Please try again.' 
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelPremium = async () => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to cancel your premium subscription? You will lose access to premium features.')) {
      return;
    }
    
    setCancelling(true);
    setMessage(null);
    
    try {
      const updatedUser = await authAPI.cancelPremium();
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMessage({ 
        type: 'success', 
        text: 'Premium subscription cancelled.' 
      });
    } catch (error: any) {
      console.error('Failed to cancel premium:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to cancel premium. Please try again.' 
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleEditProfile = () => {
    if (!user) return;
    setIsEditing(true);
    setEditingProfile({
      username: user.username || '',
      default_phone: user.default_phone || '',
      default_other_contact: user.default_other_contact || ''
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setEditingProfile({
        username: user.username || '',
        default_phone: user.default_phone || '',
        default_other_contact: user.default_other_contact || ''
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const updatedUser = await authAPI.updateProfile({
        username: editingProfile.username.trim(),
        default_phone: editingProfile.default_phone.trim() || undefined,
        default_other_contact: editingProfile.default_other_contact.trim() || undefined
      });
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully!' 
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-title gradient-text">My Profile</h1>
          <div className="profile-nav-buttons">
            <Link to="/dashboard" className="btn-secondary">← Dashboard</Link>
            <Link to="/settings" className="btn-secondary">Settings →</Link>
          </div>
        </div>

        {message && (
          <div className={`profile-message ${message.type === 'success' ? 'profile-message-success' : 'profile-message-error'}`}>
            {message.text}
          </div>
        )}

        <div className="profile-section profile-card">
          <div className="profile-section-header">
            <h2 className="profile-section-title gradient-text">Profile Information</h2>
            {!isEditing && (
              <button onClick={handleEditProfile} className="profile-edit-button btn-secondary">
                ✏️ Edit Profile
              </button>
            )}
          </div>
      
          {isEditing ? (
            <div className="profile-edit-form">
              <div className="profile-form-group">
                <label className="profile-label">Username</label>
                <input
                  type="text"
                  value={editingProfile.username}
                  onChange={(e) => setEditingProfile({ ...editingProfile, username: e.target.value })}
                  placeholder="Enter username"
                  className="profile-input"
                />
              </div>
              
              <div className="profile-form-group">
                <label className="profile-label">Default Phone</label>
                <input
                  type="tel"
                  value={editingProfile.default_phone}
                  onChange={(e) => setEditingProfile({ ...editingProfile, default_phone: e.target.value })}
                  placeholder="Enter phone number (optional)"
                  className="profile-input"
                />
                <p className="profile-help-text">This will be used when creating alerts if "Allow contacting me" is checked.</p>
              </div>
              
              <div className="profile-form-group">
                <label className="profile-label">Other Contact Info</label>
                <input
                  type="text"
                  value={editingProfile.default_other_contact}
                  onChange={(e) => setEditingProfile({ ...editingProfile, default_other_contact: e.target.value })}
                  placeholder="Enter other contact info (optional)"
                  className="profile-input"
                />
                <p className="profile-help-text">Additional contact information (e.g., Telegram, WhatsApp).</p>
              </div>
              
              <div className="profile-form-actions">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !editingProfile.username.trim()}
                  className="profile-save-button btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="profile-cancel-button btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="profile-badge-container">
                <UserBadge user={user} showRole={true} size="large" />
              </div>
              <div className="profile-details-grid">
                <div className="profile-detail-row">
                  <strong className="profile-detail-label">Email:</strong>
                  <span className="profile-detail-value">{user.email}</span>
                </div>
                <div className="profile-detail-row">
                  <strong className="profile-detail-label">Username:</strong>
                  <span className="profile-detail-value">{user.username}</span>
                </div>
                <div className="profile-detail-row">
                  <strong className="profile-detail-label">Role:</strong>
                  <span className="profile-detail-value">{user.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'User'}</span>
                </div>
                <div className="profile-detail-row">
                  <strong className="profile-detail-label">Member Since:</strong>
                  <span className="profile-detail-value">{new Date(user.date_created).toLocaleDateString()}</span>
                </div>
                {user.default_phone && (
                  <div className="profile-detail-row">
                    <strong className="profile-detail-label">Default Phone:</strong>
                    <span className="profile-detail-value">{user.default_phone}</span>
                  </div>
                )}
                {user.default_other_contact && (
                  <div className="profile-detail-row">
                    <strong className="profile-detail-label">Other Contact:</strong>
                    <span className="profile-detail-value">{user.default_other_contact}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="profile-section profile-card">
          <h2 className="profile-section-title gradient-text">Contributions</h2>
          {loading ? (
            <p className="profile-loading">Loading statistics...</p>
          ) : stats ? (
            <div className="profile-stats-grid">
              <div className="profile-stat-card">
                <div className="profile-stat-icon">🚨</div>
                <div className="profile-stat-value">{stats.alerts}</div>
                <div className="profile-stat-label">Alerts</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon">📣</div>
                <div className="profile-stat-value">{stats.requests}</div>
                <div className="profile-stat-label">Requests</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon">💬</div>
                <div className="profile-stat-value">{stats.responses}</div>
                <div className="profile-stat-label">Responses</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-icon">📋</div>
                <div className="profile-stat-value">{stats.reminders}</div>
                <div className="profile-stat-label">Reminders</div>
              </div>
              <div className="profile-stat-card profile-stat-total">
                <div className="profile-stat-icon">📊</div>
                <div className="profile-stat-value">{stats.total}</div>
                <div className="profile-stat-label">Total</div>
              </div>
            </div>
          ) : (
            <p className="profile-no-stats">No statistics available.</p>
          )}
        </div>

        <div className="profile-section profile-card">
          <h2 className="profile-section-title gradient-text">Premium Status</h2>
          <div className="profile-premium-content">
            {user.is_premium ? (
              <div className="profile-premium-active">
                <span className="profile-premium-badge">⭐ Premium Member</span>
                <p className="profile-premium-description">
                  You have access to all premium features including promoted events, 
                  advanced analytics, and enhanced visibility.
                </p>
                <button
                  onClick={handleCancelPremium}
                  disabled={cancelling}
                  className="profile-cancel-premium-button btn-secondary"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Premium'}
                </button>
              </div>
            ) : (
              <div className="profile-premium-inactive">
                <h3 className="profile-premium-title">Upgrade to Premium</h3>
                <p className="profile-premium-description">
                  Get access to premium features:
                </p>
                <ul className="profile-premium-features">
                  <li>✓ Create promoted events</li>
                  <li>✓ Highlight or boost visibility of content</li>
                  <li>✓ Access advanced stats and dashboards</li>
                  <li>✓ Additional premium-only UI sections</li>
                </ul>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="profile-upgrade-button btn-primary"
                >
                  {upgrading ? 'Upgrading...' : 'Upgrade to Premium'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
