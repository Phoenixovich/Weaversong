import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { UserBadge } from '../components/UserBadge';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

interface UserStats {
  alerts: number;
  requests: number;
  responses: number;
  reminders: number;
  total: number;
}

export const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
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
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Profile</h1>
          <Link to="/settings" style={styles.settingsLink}>
            ⚙️ Settings
          </Link>
        </div>

        {message && (
          <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
            {message.text}
          </div>
        )}

        <div style={styles.profileSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Profile Information</h2>
            {!isEditing && (
              <button onClick={handleEditProfile} style={styles.editButton}>
                ✏️ Edit Profile
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div style={styles.editForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  value={editingProfile.username}
                  onChange={(e) => setEditingProfile({ ...editingProfile, username: e.target.value })}
                  style={styles.input}
                  placeholder="Enter username"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Default Phone</label>
                <input
                  type="tel"
                  value={editingProfile.default_phone}
                  onChange={(e) => setEditingProfile({ ...editingProfile, default_phone: e.target.value })}
                  style={styles.input}
                  placeholder="Enter phone number (optional)"
                />
                <p style={styles.helpText}>This will be used when creating alerts if "Allow contacting me" is checked.</p>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Other Contact Info</label>
                <input
                  type="text"
                  value={editingProfile.default_other_contact}
                  onChange={(e) => setEditingProfile({ ...editingProfile, default_other_contact: e.target.value })}
                  style={styles.input}
                  placeholder="Enter other contact info (optional)"
                />
                <p style={styles.helpText}>Additional contact information (e.g., Telegram, WhatsApp).</p>
              </div>
              
              <div style={styles.formActions}>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !editingProfile.username.trim()}
                  style={styles.saveButton}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  style={styles.cancelEditButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.userInfo}>
              <UserBadge user={user} showRole={true} size="large" />
              <div style={styles.userDetails}>
                <div style={styles.detailRow}>
                  <strong>Email:</strong> {user.email}
                </div>
                <div style={styles.detailRow}>
                  <strong>Username:</strong> {user.username}
                </div>
                <div style={styles.detailRow}>
                  <strong>Role:</strong> {user.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'User'}
                </div>
                <div style={styles.detailRow}>
                  <strong>Member Since:</strong> {new Date(user.date_created).toLocaleDateString()}
                </div>
                {user.default_phone && (
                  <div style={styles.detailRow}>
                    <strong>Default Phone:</strong> {user.default_phone}
                  </div>
                )}
                {user.default_other_contact && (
                  <div style={styles.detailRow}>
                    <strong>Other Contact:</strong> {user.default_other_contact}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={styles.statsSection}>
          <h2 style={styles.sectionTitle}>Contributions</h2>
          {loading ? (
            <p>Loading statistics...</p>
          ) : stats ? (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>🚨</div>
                <div style={styles.statValue}>{stats.alerts}</div>
                <div style={styles.statLabel}>Alerts</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>📣</div>
                <div style={styles.statValue}>{stats.requests}</div>
                <div style={styles.statLabel}>Requests</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>💬</div>
                <div style={styles.statValue}>{stats.responses}</div>
                <div style={styles.statLabel}>Responses</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>📋</div>
                <div style={styles.statValue}>{stats.reminders}</div>
                <div style={styles.statLabel}>Reminders</div>
              </div>
              <div style={{ ...styles.statCard, ...styles.totalCard }}>
                <div style={styles.statIcon}>📊</div>
                <div style={styles.statValue}>{stats.total}</div>
                <div style={styles.statLabel}>Total</div>
              </div>
            </div>
          ) : (
            <p>No statistics available.</p>
          )}
        </div>

        <div style={styles.premiumSection}>
          <h2 style={styles.sectionTitle}>Premium Status</h2>
          <div style={styles.premiumCard}>
            {user.is_premium ? (
              <>
                <div style={styles.premiumActive}>
                  <span style={styles.premiumBadge}>⭐ Premium Member</span>
                  <p style={styles.premiumDescription}>
                    You have access to all premium features including promoted events, 
                    advanced analytics, and enhanced visibility.
                  </p>
                  <button
                    onClick={handleCancelPremium}
                    disabled={cancelling}
                    style={styles.cancelButton}
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Premium'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={styles.premiumInactive}>
                  <h3 style={styles.premiumTitle}>Upgrade to Premium</h3>
                  <p style={styles.premiumDescription}>
                    Get access to premium features:
                  </p>
                  <ul style={styles.premiumFeatures}>
                    <li style={styles.premiumFeatureItem}>✓ Create promoted events</li>
                    <li style={styles.premiumFeatureItem}>✓ Highlight or boost visibility of content</li>
                    <li style={styles.premiumFeatureItem}>✓ Access advanced stats and dashboards</li>
                    <li style={styles.premiumFeatureItem}>✓ Additional premium-only UI sections</li>
                  </ul>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    style={styles.upgradeButton}
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

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1000px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '1rem',
  },
  title: {
    margin: 0,
    color: '#333',
  },
  settingsLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: '1px solid #007bff',
    transition: 'all 0.3s',
  },
  profileSection: {
    marginBottom: '2rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  userDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  detailRow: {
    padding: '0.75rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  statsSection: {
    marginBottom: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid #e0e0e0',
  },
  sectionTitle: {
    marginBottom: '1.5rem',
    color: '#333',
    fontSize: '1.5rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
  },
  statCard: {
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px solid #e9ecef',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  totalCard: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  statIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#666',
  },
  premiumSection: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid #e0e0e0',
  },
  premiumCard: {
    padding: '1.5rem',
    borderRadius: '8px',
    border: '2px solid #e9ecef',
  },
  premiumActive: {
    backgroundColor: '#f0f8ff',
    padding: '1.5rem',
    borderRadius: '8px',
  },
  premiumInactive: {
    backgroundColor: '#fffaf0',
    padding: '1.5rem',
    borderRadius: '8px',
  },
  premiumBadge: {
    display: 'inline-block',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: '1rem',
  },
  premiumTitle: {
    marginTop: 0,
    color: '#333',
  },
  premiumDescription: {
    color: '#666',
    marginBottom: '1rem',
  },
  premiumFeatures: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '1.5rem',
  },
  premiumFeatureItem: {
    padding: '0.5rem 0',
    color: '#333',
  },
  upgradeButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.3s',
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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  editButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  editForm: {
    marginTop: '1rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  helpText: {
    marginTop: '0.25rem',
    fontSize: '0.85rem',
    color: '#666',
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  cancelEditButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
};

