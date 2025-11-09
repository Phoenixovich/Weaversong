import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserBadge } from '../components/UserBadge';
import { UserRole } from '../types/auth';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

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

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Welcome Section */}
        <div style={styles.welcomeCard}>
          <h1 style={styles.welcomeTitle}>Welcome to Your Dashboard</h1>
          <div style={styles.userWelcome}>
            <UserBadge user={user!} showRole={true} size="large" />
            <p style={styles.welcomeText}>
              {user?.is_premium ? '⭐ Premium Member' : 'Standard User'} • {getRoleDisplayName(user?.role)}
            </p>
            <p style={styles.welcomeSubtext}>{getRoleDescription(user?.role)}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🚀 Quick Access</h2>
          <div style={styles.servicesGrid}>
            <Link to="/citypulse" style={styles.serviceCard}>
              <div style={styles.serviceIcon}>🚨</div>
              <h3>CityPulse</h3>
              <p>Report and view community alerts and incidents</p>
            </Link>
            <Link to="/helpboard/users" style={styles.serviceCard}>
              <div style={styles.serviceIcon}>👷</div>
              <h3>Helpboard</h3>
              <p>Find local professionals and request help</p>
            </Link>
            <Link to="/clarifai" style={styles.serviceCard}>
              <div style={styles.serviceIcon}>📄</div>
              <h3>ClarifAI</h3>
              <p>Simplify medical and legal documents</p>
            </Link>
            <Link to="/public-data" style={styles.serviceCard}>
              <div style={styles.serviceIcon}>📊</div>
              <h3>Public Data Hub</h3>
              <p>Explore government data and social benefits</p>
            </Link>
            <Link to="/profile" style={styles.serviceCard}>
              <div style={styles.serviceIcon}>👤</div>
              <h3>Your Profile</h3>
              <p>View contributions and manage account</p>
            </Link>
            <Link to="/settings" style={styles.serviceCard}>
              <div style={styles.serviceIcon}>⚙️</div>
              <h3>Settings</h3>
              <p>Manage preferences and account settings</p>
            </Link>
          </div>
        </div>

        {/* Role Permissions Table */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 Role Permissions Guide</h2>
          <div style={styles.tableContainer}>
            <table style={styles.permissionsTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Permission</th>
                  <th style={styles.tableHeader}>User</th>
                  <th style={styles.tableHeader}>Trusted User</th>
                  <th style={styles.tableHeader}>Representative</th>
                  <th style={styles.tableHeader}>Business Owner</th>
                  <th style={styles.tableHeader}>Moderator</th>
                  <th style={styles.tableHeader}>Admin</th>
                </tr>
              </thead>
              <tbody>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>Alerts</strong></td>
                  <td colSpan={6} style={styles.tableCell}></td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Create alerts</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Edit own alerts</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Edit any alert</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Delete own alerts</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Delete any alert</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>Helpdesk Requests</strong></td>
                  <td colSpan={6} style={styles.tableCell}></td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Create requests</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Edit own requests</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Edit any request</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Delete own requests</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Delete any request</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>Helpdesk Responses</strong></td>
                  <td colSpan={6} style={styles.tableCell}></td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Create responses</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Edit own responses</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Edit any response</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Delete own responses</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Delete any response</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>General</strong></td>
                  <td colSpan={6} style={styles.tableCell}></td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>View all content</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>Premium features</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>✅*</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}>User management</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>❌</td>
                  <td style={styles.tableCell}>✅</td>
                </tr>
              </tbody>
            </table>
            <p style={styles.tableNote}>*Admins have access to all features regardless of premium status</p>
          </div>
        </div>

        {/* Tutorials and Guides */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📚 Tutorials & Guides</h2>
          
          {/* How to Create an Alert */}
          <div style={styles.guideCard}>
            <div 
              style={styles.guideHeader}
              onClick={() => toggleSection('create-alert')}
            >
              <h3 style={styles.guideTitle}>🚨 How to Create an Alert</h3>
              <span style={styles.expandIcon}>
                {expandedSection === 'create-alert' ? '▼' : '▶'}
              </span>
            </div>
            {expandedSection === 'create-alert' && (
              <div style={styles.guideContent}>
                <ol style={styles.stepsList}>
                  <li>Go to <Link to="/citypulse">CityPulse</Link> page</li>
                  <li>Choose your input method:
                    <ul style={styles.subList}>
                      <li><strong>Text:</strong> Type your alert description</li>
                      <li><strong>Voice:</strong> Click microphone and speak your alert</li>
                      <li><strong>Form:</strong> Fill out the detailed form manually</li>
                    </ul>
                  </li>
                  <li>Provide location information:
                    <ul style={styles.subList}>
                      <li>Mention location in text (e.g., "Politehnica", "Herastrau Park")</li>
                      <li>Click "Get Current Location" to use your GPS</li>
                      <li>Or select location on the map</li>
                    </ul>
                  </li>
                  <li>If logged in, check "Allow contacting me" to auto-fill contact info from your profile</li>
                  <li>Click "Analyze" to let AI extract alert details</li>
                  <li>Review the analysis and click "Submit Alert"</li>
                </ol>
                <div style={styles.tipBox}>
                  <strong>💡 Tip:</strong> Be specific about location and include relevant details like time, severity, and any immediate actions needed.
                </div>
              </div>
            )}
          </div>

          {/* How to Edit/Delete Content */}
          <div style={styles.guideCard}>
            <div 
              style={styles.guideHeader}
              onClick={() => toggleSection('edit-delete')}
            >
              <h3 style={styles.guideTitle}>✏️ How to Edit or Delete Content</h3>
              <span style={styles.expandIcon}>
                {expandedSection === 'edit-delete' ? '▼' : '▶'}
              </span>
            </div>
            {expandedSection === 'edit-delete' && (
              <div style={styles.guideContent}>
                <h4 style={styles.subTitle}>Edit Permissions:</h4>
                <ul style={styles.stepsList}>
                  <li><strong>Your own content:</strong> You can always edit alerts, requests, and responses you created</li>
                  <li><strong>Others' content:</strong> Trusted users and above can edit any content</li>
                </ul>
                <h4 style={styles.subTitle}>Delete Permissions:</h4>
                <ul style={styles.stepsList}>
                  <li><strong>Your own content:</strong> You can always delete your own content</li>
                  <li><strong>Others' content:</strong> Only Moderators and Admins can delete others' content</li>
                </ul>
                <h4 style={styles.subTitle}>How to Edit:</h4>
                <ol style={styles.stepsList}>
                  <li>Find the content you want to edit (alert, request, or response)</li>
                  <li>Look for the "Edit" button (only visible if you have permission)</li>
                  <li>Click "Edit" to modify the content</li>
                  <li>Save your changes</li>
                </ol>
                <h4 style={styles.subTitle}>How to Delete:</h4>
                <ol style={styles.stepsList}>
                  <li>Find the content you want to delete</li>
                  <li>Click the "Delete" button (only visible if you have permission)</li>
                  <li>Confirm the deletion</li>
                </ol>
              </div>
            )}
          </div>

          {/* How to Use Helpboard */}
          <div style={styles.guideCard}>
            <div 
              style={styles.guideHeader}
              onClick={() => toggleSection('helpboard')}
            >
              <h3 style={styles.guideTitle}>👷 How to Use Helpboard</h3>
              <span style={styles.expandIcon}>
                {expandedSection === 'helpboard' ? '▼' : '▶'}
              </span>
            </div>
            {expandedSection === 'helpboard' && (
              <div style={styles.guideContent}>
                <h4 style={styles.subTitle}>Creating a Request:</h4>
                <ol style={styles.stepsList}>
                  <li>Go to <Link to="/helpboard/requests">Helpboard Requests</Link></li>
                  <li>Fill out the request form with:
                    <ul style={styles.subList}>
                      <li>Title and description of what you need</li>
                      <li>Trade or service needed (e.g., "Plumber", "Electrician")</li>
                      <li>Urgency level (High, Medium, Low)</li>
                      <li>Budget (optional)</li>
                    </ul>
                  </li>
                  <li>Submit your request</li>
                </ol>
                <h4 style={styles.subTitle}>Responding to Requests:</h4>
                <ol style={styles.stepsList}>
                  <li>Browse available requests</li>
                  <li>Click on a request to see details</li>
                  <li>Fill out the response form with your message</li>
                  <li>Submit your response</li>
                </ol>
                <h4 style={styles.subTitle}>Finding Helpers:</h4>
                <ol style={styles.stepsList}>
                  <li>Go to <Link to="/helpboard/users">Nearby Helpers</Link></li>
                  <li>Allow location access to find nearby professionals</li>
                  <li>Search by trade if needed</li>
                  <li>View helper profiles with experience and rates</li>
                </ol>
              </div>
            )}
          </div>

          {/* Profile Management */}
          <div style={styles.guideCard}>
            <div 
              style={styles.guideHeader}
              onClick={() => toggleSection('profile')}
            >
              <h3 style={styles.guideTitle}>👤 Profile Management</h3>
              <span style={styles.expandIcon}>
                {expandedSection === 'profile' ? '▼' : '▶'}
              </span>
            </div>
            {expandedSection === 'profile' && (
              <div style={styles.guideContent}>
                <h4 style={styles.subTitle}>Editing Your Profile:</h4>
                <ol style={styles.stepsList}>
                  <li>Go to <Link to="/profile">Your Profile</Link></li>
                  <li>Click "Edit Profile" button</li>
                  <li>Update your username, default phone, or other contact info</li>
                  <li>Click "Save Changes"</li>
                </ol>
                <h4 style={styles.subTitle}>Default Contact Information:</h4>
                <ul style={styles.stepsList}>
                  <li>Set your default phone number and other contact info in your profile</li>
                  <li>When creating alerts, check "Allow contacting me" to auto-fill this information</li>
                  <li>This saves time when creating multiple alerts</li>
                </ul>
                <h4 style={styles.subTitle}>Viewing Your Contributions:</h4>
                <ul style={styles.stepsList}>
                  <li>Your profile shows statistics of all your contributions:
                    <ul style={styles.subList}>
                      <li>Alerts created</li>
                      <li>Helpdesk requests created</li>
                      <li>Helpdesk responses created</li>
                      <li>Reminders created</li>
                    </ul>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Premium Features */}
          <div style={styles.guideCard}>
            <div 
              style={styles.guideHeader}
              onClick={() => toggleSection('premium')}
            >
              <h3 style={styles.guideTitle}>⭐ Premium Features</h3>
              <span style={styles.expandIcon}>
                {expandedSection === 'premium' ? '▼' : '▶'}
              </span>
            </div>
            {expandedSection === 'premium' && (
              <div style={styles.guideContent}>
                <h4 style={styles.subTitle}>Premium Benefits:</h4>
                <ul style={styles.stepsList}>
                  <li>✅ Create promoted events</li>
                  <li>✅ Highlight or boost visibility of content</li>
                  <li>✅ Access advanced stats and dashboards</li>
                  <li>✅ Additional premium-only UI sections</li>
                  <li>✅ Premium badge (⭐) next to your username</li>
                </ul>
                <h4 style={styles.subTitle}>How to Upgrade:</h4>
                <ol style={styles.stepsList}>
                  <li>Go to <Link to="/profile">Your Profile</Link></li>
                  <li>Scroll to "Manage Premium" section</li>
                  <li>Click "Upgrade to Premium" button</li>
                  <li>Enjoy premium features!</li>
                </ol>
                <h4 style={styles.subTitle}>Managing Premium Badge:</h4>
                <ul style={styles.stepsList}>
                  <li>Go to <Link to="/settings">Settings</Link></li>
                  <li>Toggle "Show purple star (⭐) next to my username"</li>
                  <li>You'll still have premium features, but the badge won't be visible</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Role Information */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🎭 Understanding Roles</h2>
          <div style={styles.rolesGrid}>
            <div style={styles.roleCard}>
              <div style={styles.roleIcon}>👤</div>
              <h3>User</h3>
              <p>Standard account with basic permissions. Can create and manage own content.</p>
            </div>
            <div style={styles.roleCard}>
              <div style={styles.roleIcon}>✓</div>
              <h3>Trusted User</h3>
              <p>Verified community member. Can edit any content but can only delete own content.</p>
            </div>
            <div style={styles.roleCard}>
              <div style={styles.roleIcon}>🛡️</div>
              <h3>Moderator</h3>
              <p>Content moderator with delete permissions. Can edit and delete any content.</p>
            </div>
            <div style={styles.roleCard}>
              <div style={styles.roleIcon}>🏛️</div>
              <h3>Representative</h3>
              <p>Official representative with special privileges for official announcements.</p>
            </div>
            <div style={styles.roleCard}>
              <div style={styles.roleIcon}>🏢</div>
              <h3>Business Owner</h3>
              <p>Business account with promotional features and business analytics.</p>
            </div>
            <div style={styles.roleCard}>
              <div style={styles.roleIcon}>👑</div>
              <h3>Admin</h3>
              <p>System administrator with full access including user management.</p>
            </div>
          </div>
        </div>

        {/* Tips and Best Practices */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💡 Tips & Best Practices</h2>
          <div style={styles.tipsGrid}>
            <div style={styles.tipCard}>
              <h4>📝 Creating Effective Alerts</h4>
              <ul style={styles.tipsList}>
                <li>Be specific about location (street name, landmark, sector)</li>
                <li>Include time-sensitive information</li>
                <li>Use appropriate priority levels</li>
                <li>Provide contact information if you want to be reached</li>
              </ul>
            </div>
            <div style={styles.tipCard}>
              <h4>🔒 Privacy & Security</h4>
              <ul style={styles.tipsList}>
                <li>Contact info is optional - only share if comfortable</li>
                <li>You can toggle premium badge visibility in settings</li>
                <li>Edit or delete your content anytime</li>
                <li>Report inappropriate content to moderators</li>
              </ul>
            </div>
            <div style={styles.tipCard}>
              <h4>⚡ Quick Actions</h4>
              <ul style={styles.tipsList}>
                <li>Use voice input for faster alert creation</li>
                <li>Set default contact info in profile for convenience</li>
                <li>Bookmark frequently used pages</li>
                <li>Check your profile for contribution statistics</li>
              </ul>
            </div>
            <div style={styles.tipCard}>
              <h4>🤝 Community Guidelines</h4>
              <ul style={styles.tipsList}>
                <li>Be respectful and helpful</li>
                <li>Provide accurate information</li>
                <li>Update or delete outdated content</li>
                <li>Help moderate by reporting issues</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature Reference Table */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📖 Feature Reference</h2>
          <div style={styles.tableContainer}>
            <table style={styles.featureTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Feature</th>
                  <th style={styles.tableHeader}>Description</th>
                  <th style={styles.tableHeader}>Access</th>
                </tr>
              </thead>
              <tbody>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>CityPulse</strong></td>
                  <td style={styles.tableCell}>Community incident reporting platform for Bucharest</td>
                  <td style={styles.tableCell}>Public (create requires login)</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>Helpboard</strong></td>
                  <td style={styles.tableCell}>Find local professionals and request help</td>
                  <td style={styles.tableCell}>Public (create requires login)</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>ClarifAI</strong></td>
                  <td style={styles.tableCell}>Simplify complex medical and legal documents</td>
                  <td style={styles.tableCell}>Public (view-only)</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>Public Data Hub</strong></td>
                  <td style={styles.tableCell}>Explore government data and social benefits</td>
                  <td style={styles.tableCell}>Public (view-only)</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>Profile</strong></td>
                  <td style={styles.tableCell}>View contributions, manage account, upgrade premium</td>
                  <td style={styles.tableCell}>Login required</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>Settings</strong></td>
                  <td style={styles.tableCell}>Manage preferences and premium badge visibility</td>
                  <td style={styles.tableCell}>Login required</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>Edit/Delete Content</strong></td>
                  <td style={styles.tableCell}>Edit own content; Trusted+ can edit any; Moderators+ can delete any</td>
                  <td style={styles.tableCell}>Based on role</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableCell}><strong>Premium Features</strong></td>
                  <td style={styles.tableCell}>Promoted events, content highlighting, advanced analytics</td>
                  <td style={styles.tableCell}>Premium subscription</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Reference */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔍 Quick Reference</h2>
          <div style={styles.referenceGrid}>
            <div style={styles.referenceCard}>
              <h4>Need Help?</h4>
              <p>Check the tutorials above or contact support</p>
            </div>
            <div style={styles.referenceCard}>
              <h4>Want to Contribute?</h4>
              <p>Create alerts, help requests, or respond to others</p>
            </div>
            <div style={styles.referenceCard}>
              <h4>Want More Features?</h4>
              <p>Upgrade to Premium in your <Link to="/profile">Profile</Link></p>
            </div>
            <div style={styles.referenceCard}>
              <h4>Have Questions?</h4>
              <p>Review the permissions table and role descriptions above</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '2rem 1rem',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  welcomeCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: '2rem',
    marginBottom: '1.5rem',
    color: '#333',
  },
  userWelcome: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  welcomeText: {
    fontSize: '1.1rem',
    color: '#666',
    margin: '0.5rem 0',
  },
  welcomeSubtext: {
    fontSize: '0.9rem',
    color: '#999',
  },
  section: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: '#333',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '0.5rem',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  serviceCard: {
    display: 'block',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#333',
    transition: 'transform 0.3s, box-shadow 0.3s',
    border: '2px solid #e9ecef',
    textAlign: 'center',
  },
  serviceIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  tableContainer: {
    overflowX: 'auto',
    marginTop: '1rem',
  },
  permissionsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  featureTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  tableHeader: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.75rem',
    textAlign: 'left',
    fontWeight: 'bold',
    border: '1px solid #0056b3',
  },
  tableRow: {
    borderBottom: '1px solid #e9ecef',
  },
  tableCell: {
    padding: '0.75rem',
    border: '1px solid #e9ecef',
    verticalAlign: 'top',
  },
  tableNote: {
    marginTop: '0.5rem',
    fontSize: '0.85rem',
    color: '#666',
    fontStyle: 'italic',
  },
  guideCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '1rem',
    border: '1px solid #e9ecef',
    overflow: 'hidden',
  },
  guideHeader: {
    padding: '1rem 1.5rem',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e9ecef',
    transition: 'background-color 0.2s',
  },
  guideTitle: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#333',
  },
  expandIcon: {
    fontSize: '0.8rem',
    color: '#666',
  },
  guideContent: {
    padding: '1.5rem',
  },
  subTitle: {
    fontSize: '1rem',
    marginTop: '1rem',
    marginBottom: '0.5rem',
    color: '#333',
  },
  stepsList: {
    marginLeft: '1.5rem',
    lineHeight: '1.8',
    color: '#555',
  },
  subList: {
    marginLeft: '1.5rem',
    marginTop: '0.5rem',
  },
  tipBox: {
    backgroundColor: '#e7f3ff',
    borderLeft: '4px solid #007bff',
    padding: '1rem',
    marginTop: '1rem',
    borderRadius: '4px',
  },
  rolesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
  },
  roleCard: {
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px solid #e9ecef',
  },
  roleIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
  },
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  tipCard: {
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  tipsList: {
    marginLeft: '1.5rem',
    lineHeight: '1.8',
    color: '#555',
  },
  referenceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  referenceCard: {
    padding: '1.5rem',
    backgroundColor: '#e7f3ff',
    borderRadius: '8px',
    border: '1px solid #b3d9ff',
    textAlign: 'center',
  },
};
