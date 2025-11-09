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
      <div className="container">
        <div className="card">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1 className="title">My Profile</h1>
          <Link to="/settings" className="settingsLink">
            ⚙️ Settings
          </Link>
        </div>

        {message && (
          <div className={message.type === 'success' ? 'successMessage' : 'errorMessage'}>
            {message.text}
          </div>
        )}

        <div className="profileSection">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Profile Information</h2>
            {!isEditing && (
              <button onClick={handleEditProfile} className="editButton">
                ✏️ Edit Profile
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="editForm">
              <div className="formGroup">
                <label className="label">Username</label>
                <input
                  type="text"
                  value={editingProfile.username}
                  onChange={(e) => setEditingProfile({ ...editingProfile, username: e.target.value })}
                  className="input"
                  placeholder="Enter username"
                />
              </div>
              
              <div className="formGroup">
                <label className="label">Default Phone</label>
                <input
                  type="tel"
                  value={editingProfile.default_phone}
                  onChange={(e) => setEditingProfile({ ...editingProfile, default_phone: e.target.value })}
                  className="input"
                  placeholder="Enter phone number (optional)"
                />
                <p className="helpText">This will be used when creating alerts if "Allow contacting me" is checked.</p>
              </div>
              
              <div className="formGroup">
                <label className="label">Other Contact Info</label>
                <input
                  type="text"
                  value={editingProfile.default_other_contact}
                  onChange={(e) => setEditingProfile({ ...editingProfile, default_other_contact: e.target.value })}
                  className="input"
                  placeholder="Enter other contact info (optional)"
                />
                <p className="helpText">Additional contact information (e.g., Telegram, WhatsApp).</p>
              </div>
              
              <div className="formActions">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !editingProfile.username.trim()}
                  className="saveButton"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="cancelEditButton"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="userInfo">
              <UserBadge user={user} showRole={true} size="large" />
              <div className="userDetails">
                <div className="detailRow">
                  <strong>Email:</strong> {user.email}
                </div>
                <div className="detailRow">
                  <strong>Username:</strong> {user.username}
                </div>
                <div className="detailRow">
                  <strong>Role:</strong> {user.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'User'}
                </div>
                <div className="detailRow">
                  <strong>Member Since:</strong> {new Date(user.date_created).toLocaleDateString()}
                </div>
                {user.default_phone && (
                  <div className="detailRow">
                    <strong>Default Phone:</strong> {user.default_phone}
                  </div>
                )}
                {user.default_other_contact && (
                  <div className="detailRow">
                    <strong>Other Contact:</strong> {user.default_other_contact}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="statsSection">
          <h2 className="sectionTitle">Contributions</h2>
          {loading ? (
            <p>Loading statistics...</p>
          ) : stats ? (
            <div className="statsGrid">
              <div className="statCard">
                <div className="statIcon">🚨</div>
                <div className="statValue">{stats.alerts}</div>
                <div className="statLabel">Alerts</div>
              </div>
              <div className="statCard">
                <div className="statIcon">📣</div>
                <div className="statValue">{stats.requests}</div>
                <div className="statLabel">Requests</div>
              </div>
              <div className="statCard">
                <div className="statIcon">💬</div>
                <div className="statValue">{stats.responses}</div>
                <div className="statLabel">Responses</div>
              </div>
              <div className="statCard">
                <div className="statIcon">📋</div>
                <div className="statValue">{stats.reminders}</div>
                <div className="statLabel">Reminders</div>
              </div>
              <div className="statCard totalCard">
                <div className="statIcon">📊</div>
                <div className="statValue">{stats.total}</div>
                <div className="statLabel">Total</div>
              </div>
            </div>
          ) : (
            <p>No statistics available.</p>
          )}
        </div>

        <div className="premiumSection">
          <h2 className="sectionTitle">Premium Status</h2>
          <div className="premiumCard">
            {user.is_premium ? (
              <>
                <div className="premiumActive">
                  <span className="premiumBadge">⭐ Premium Member</span>
                  <p className="premiumDescription">
                    You have access to all premium features including promoted events, 
                    advanced analytics, and enhanced visibility.
                  </p>
                  <button
                    onClick={handleCancelPremium}
                    disabled={cancelling}
                    className="cancelButton"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Premium'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="premiumInactive">
                  <h3 className="premiumTitle">Upgrade to Premium</h3>
                  <p className="premiumDescription">
                    Get access to premium features:
                  </p>
                  <ul className="premiumFeatures">
                    <li className="premiumFeatureItem">✓ Create promoted events</li>
                    <li className="premiumFeatureItem">✓ Highlight or boost visibility of content</li>
                    <li className="premiumFeatureItem">✓ Access advanced stats and dashboards</li>
                    <li className="premiumFeatureItem">✓ Additional premium-only UI sections</li>
                  </ul>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="upgradeButton"
                  >
                    {upgrading ? 'Upgrading...' : 'Upgrade to Premium'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


