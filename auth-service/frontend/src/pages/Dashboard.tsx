import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserBadge } from '../components/UserBadge';
import { UserRole } from '../types/auth';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const isExpanded = (section: string) => expandedSections.has(section);

  const getRoleDisplayName = (role?: UserRole): string => {
    if (!role) return 'User';
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRoleDescription = (role?: UserRole): string => {
    switch (role) {
      case UserRole.USER:
        return 'Standard user with basic permissions';
      case UserRole.TRUSTED_USER:
        return 'Verified community member with extended editing permissions';
      case UserRole.MODERATOR:
        return 'Content moderator with delete permissions';
      case UserRole.REPRESENTATIVE:
        return 'Official representative with special privileges';
      case UserRole.BUSINESS_OWNER:
        return 'Business account with promotional features';
      case UserRole.ADMIN:
        return 'System administrator with full access';
      default:
        return 'Standard user with basic permissions';
    }
  };

  const quickLinks = [
    { to: '/citypulse', icon: '🚨', title: 'CityPulse', desc: 'Report and view community alerts' },
    { to: '/helpboard/users', icon: '👷', title: 'Helpboard', desc: 'Find local professionals' },
    { to: '/clarifai', icon: '📄', title: 'ClarifAI', desc: 'Simplify documents' },
    { to: '/public-data', icon: '📊', title: 'Public Data Hub', desc: 'Explore government data' },
    { to: '/profile', icon: '👤', title: 'Your Profile', desc: 'Manage your account' },
    { to: '/settings', icon: '⚙️', title: 'Settings', desc: 'Preferences & settings' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-section dashboard-card">
          <h1 className="dashboard-title gradient-text">Welcome back!</h1>
          <div className="user-info">
            <UserBadge user={user!} showRole={true} size="large" />
            <p className="user-status">
              {user?.is_premium ? '⭐ Premium Member' : 'Standard User'} • {getRoleDisplayName(user?.role)}
            </p>
            <p className="user-description">{getRoleDescription(user?.role)}</p>
          </div>
          <div className="action-links">
            <Link to="/profile" className="btn-secondary">View Profile</Link>
            <Link to="/settings" className="btn-secondary">Settings</Link>
          </div>
        </div>

        <div className="quick-access-section dashboard-card">
          <h2 className="section-title gradient-text">🚀 Quick Access</h2>
          <div className="quick-links-grid">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to} className="quick-link-card dashboard-card-hover">
                <div className="quick-link-icon">{link.icon}</div>
                <h3 className="quick-link-title">{link.title}</h3>
                <p className="quick-link-desc">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="section dashboard-card">
          <div className="section-header" onClick={() => toggleSection('tips')}>
            <h2 className="section-title gradient-text">💡 Tips & Best Practices</h2>
            <span className="expand-icon">{isExpanded('tips') ? '▼' : '▶'}</span>
          </div>
          {isExpanded('tips') && (
            <div className="section-content">
              <div className="tip-card">
                <h4 className="tip-title">📝 Creating Effective Alerts</h4>
                <ul className="tip-list">
                  <li>Be specific about location</li>
                  <li>Include time-sensitive information</li>
                  <li>Use appropriate priority levels</li>
                  <li>Provide contact information</li>
                </ul>
              </div>
              <div className="tip-card">
                <h4 className="tip-title">🔒 Privacy & Security</h4>
                <ul className="tip-list">
                  <li>Contact info is optional</li>
                  <li>Toggle premium badge in settings</li>
                  <li>Edit or delete content anytime</li>
                  <li>Report inappropriate content</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="section dashboard-card">
          <div className="section-header" onClick={() => toggleSection('role-permissions')}>
            <h2 className="section-title gradient-text">📋 Role Permissions Guide</h2>
            <span className="expand-icon">{isExpanded('role-permissions') ? '▼' : '▶'}</span>
          </div>
          {isExpanded('role-permissions') && (
            <div className="section-content">
              <div className="table-container">
                <table className="permissions-table">
                  <thead>
                    <tr>
                      <th>Permission</th>
                      <th>User</th>
                      <th>Trusted User</th>
                      <th>Representative</th>
                      <th>Business Owner</th>
                      <th>Moderator</th>
                      <th>Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Alerts</strong></td>
                      <td colSpan={6}></td>
                    </tr>
                    <tr>
                      <td>Create alerts</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                    </tr>
                    <tr>
                      <td>Edit own alerts</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                    </tr>
                    <tr>
                      <td>Edit any alert</td>
                      <td>❌</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                    </tr>
                    <tr>
                      <td>Delete own alerts</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                      <td>✅</td>
                    </tr>
                    <tr>
                      <td>Delete any alert</td>
                      <td>❌</td>
                      <td>❌</td>
                      <td>❌</td>
                      <td>❌</td>
                      <td>✅</td>
                      <td>✅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="section dashboard-card">
          <div className="section-header" onClick={() => toggleSection('tutorials')}>
            <h2 className="section-title gradient-text">📚 Tutorials & Guides</h2>
            <span className="expand-icon">{isExpanded('tutorials') ? '▼' : '▶'}</span>
          </div>
          {isExpanded('tutorials') && (
            <div className="section-content">
              <div className="tutorial-card">
                <h3 className="tutorial-title">🚨 How to Create an Alert</h3>
                <ol className="tutorial-list">
                  <li>Go to <Link to="/citypulse" className="tutorial-link">CityPulse</Link> page</li>
                  <li>Choose your input method (Text, Voice, or Form)</li>
                  <li>Provide location information</li>
                  <li>Click "Analyze" and review</li>
                  <li>Submit your alert</li>
                </ol>
              </div>
              <div className="tutorial-card">
                <h3 className="tutorial-title">👷 How to Use Helpboard</h3>
                <ol className="tutorial-list">
                  <li>Go to <Link to="/helpboard/requests" className="tutorial-link">Helpboard Requests</Link></li>
                  <li>Fill out the request form</li>
                  <li>Submit your request</li>
                  <li>Browse and respond to requests</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
