import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserBadge } from '../components/UserBadge';
import { UserRole } from '../types/auth';
import './Dashboard.css';

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
    <div className="container">
      <div className="content">
        {/* Welcome Section */}
        <div className="welcomeCard">
          <h1 className="welcomeTitle">Welcome to Your Dashboard</h1>
          <div className="userWelcome">
            <UserBadge user={user!} showRole={true} size="large" />
            <p className="welcomeText">
              {user?.is_premium ? '⭐ Premium Member' : 'Standard User'} • {getRoleDisplayName(user?.role)}
            </p>
            <p className="welcomeSubtext">{getRoleDescription(user?.role)}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="section">
          <h2 className="sectionTitle">🚀 Quick Access</h2>
          <div className="servicesGrid">
            <Link to="/citypulse" className="serviceCard">
              <div className="serviceIcon">🚨</div>
              <h3>CityPulse</h3>
              <p>Report and view community alerts and incidents</p>
            </Link>
            <Link to="/helpboard/users" className="serviceCard">
              <div className="serviceIcon">👷</div>
              <h3>Helpboard</h3>
              <p>Find local professionals and request help</p>
            </Link>
            <Link to="/clarifai" className="serviceCard">
              <div className="serviceIcon">📄</div>
              <h3>ClarifAI</h3>
              <p>Simplify medical and legal documents</p>
            </Link>
            <Link to="/public-data" className="serviceCard">
              <div className="serviceIcon">📊</div>
              <h3>Public Data Hub</h3>
              <p>Explore government data and social benefits</p>
            </Link>
            <Link to="/profile" className="serviceCard">
              <div className="serviceIcon">👤</div>
              <h3>Your Profile</h3>
              <p>View contributions and manage account</p>
            </Link>
            <Link to="/settings" className="serviceCard">
              <div className="serviceIcon">⚙️</div>
              <h3>Settings</h3>
              <p>Manage preferences and account settings</p>
            </Link>
          </div>
        </div>

        {/* Role Permissions Table */}
        <div className="section">
          <h2 className="sectionTitle">📋 Role Permissions Guide</h2>
          <div className="tableContainer">
            <table className="permissionsTable">
              <thead>
                <tr>
                  <th className="tableHeader">Permission</th>
                  <th className="tableHeader">User</th>
                  <th className="tableHeader">Trusted User</th>
                  <th className="tableHeader">Representative</th>
                  <th className="tableHeader">Business Owner</th>
                  <th className="tableHeader">Moderator</th>
                  <th className="tableHeader">Admin</th>
                </tr>
              </thead>
              <tbody>
                <tr className="tableRow">
                  <td className="tableCell"><strong>Alerts</strong></td>
                  <td colSpan={6} className="tableCell"></td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Create alerts</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Edit own alerts</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Edit any alert</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Delete own alerts</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Delete any alert</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell"><strong>Helpdesk Requests</strong></td>
                  <td colSpan={6} className="tableCell"></td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Create requests</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Edit own requests</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Edit any request</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Delete own requests</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Delete any request</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell"><strong>Helpdesk Responses</strong></td>
                  <td colSpan={6} className="tableCell"></td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Create responses</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Edit own responses</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Edit any response</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Delete own responses</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Delete any response</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell"><strong>General</strong></td>
                  <td colSpan={6} className="tableCell"></td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">View all content</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                  <td className="tableCell">✅</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">Premium features</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">✅*</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell">User management</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">❌</td>
                  <td className="tableCell">✅</td>
                </tr>
              </tbody>
            </table>
            <p className="tableNote">*Admins have access to all features regardless of premium status</p>
          </div>
        </div>

        {/* Tutorials and Guides */}
        <div className="section">
          <h2 className="sectionTitle">📚 Tutorials & Guides</h2>
          
          {/* How to Create an Alert */}
          <div className="guideCard">
            <div 
              className="guideHeader"
              onClick={() => toggleSection('create-alert')}
            >
              <h3 className="guideTitle">🚨 How to Create an Alert</h3>
              <span className="expandIcon">
                {expandedSection === 'create-alert' ? '▼' : '▶'}
              </span>
            </div>
            {expandedSection === 'create-alert' && (
              <div className="guideContent">
                <ol className="stepsList">
                  <li>Go to <Link to="/citypulse">CityPulse</Link> page</li>
                  <li>Choose your input method:
                    <ul className="subList">
                      <li><strong>Text:</strong> Type your alert description</li>
                      <li><strong>Voice:</strong> Click microphone and speak your alert</li>
                      <li><strong>Form:</strong> Fill out the detailed form manually</li>
                    </ul>
                  </li>
                  <li>Provide location information:
                    <ul className="subList">
                      <li>Mention location in text (e.g., "Politehnica", "Herastrau Park")</li>
                      <li>Click "Get Current Location" to use your GPS</li>
                      <li>Or select location on the map</li>
                    </ul>
                  </li>
                  <li>If logged in, check "Allow contacting me" to auto-fill contact info from your profile</li>
                  <li>Click "Analyze" to let AI extract alert details</li>
                  <li>Review the analysis and click "Submit Alert"</li>
                </ol>
                <div className="tipBox">
                  <strong>💡 Tip:</strong> Be specific about location and include relevant details like time, severity, and any immediate actions needed.
                </div>
              </div>
            )}
          </div>

          {/* How to Edit/Delete Content */}
          <div className="guideCard">
            <div 
              className="guideHeader"
              onClick={() => toggleSection('edit-delete')}
            >
              <h3 className="guideTitle">✏️ How to Edit or Delete Content</h3>
              <span className="expandIcon">
                {expandedSection === 'edit-delete' ? '▼' : '▶'}
              </span>
            </div>
            {expandedSection === 'edit-delete' && (
              <div className="guideContent">
                <h4 className="subTitle">Edit Permissions:</h4>
                <ul className="stepsList">
                  <li><strong>Your own content:</strong> You can always edit alerts, requests, and responses you created</li>
                  <li><strong>Others' content:</strong> Trusted users and above can edit any content</li>
                </ul>
                <h4 className="subTitle">Delete Permissions:</h4>
                <ul className="stepsList">
                  <li><strong>Your own content:</strong> You can always delete your own content</li>
                  <li><strong>Others' content:</strong> Only Moderators and Admins can delete others' content</li>
                </ul>
                <h4 className="subTitle">How to Edit:</h4>
                <ol className="stepsList">
                  <li>Find the content you want to edit (alert, request, or response)</li>
                  <li>Look for the "Edit" button (only visible if you have permission)</li>
                  <li>Click "Edit" to modify the content</li>
                  <li>Save your changes</li>
                </ol>
                <h4 className="subTitle">How to Delete:</h4>
                <ol className="stepsList">
                  <li>Find the content you want to delete</li>
                  <li>Click the "Delete" button (only visible if you have permission)</li>
                  <li>Confirm the deletion</li>
                </ol>
              </div>
            )}
          </div>

          {/* How to Use Helpboard */}
          <div className="guideCard">
            <div 
              className="guideHeader"
              onClick={() => toggleSection('helpboard')}
            >
              <h3 className="guideTitle">👷 How to Use Helpboard</h3>
              <span className="expandIcon">
                {expandedSection === 'helpboard' ? '▼' : '▶'}
              </span>
            </div>
            {expandedSection === 'helpboard' && (
              <div className="guideContent">
                <h4 className="subTitle">Creating a Request:</h4>
                <ol className="stepsList">
                  <li>Go to <Link to="/helpboard/requests">Helpboard Requests</Link></li>
                  <li>Fill out the request form with:
                    <ul className="subList">
                      <li>Title and description of what you need</li>
                      <li>Trade or service needed (e.g., "Plumber", "Electrician")</li>
                      <li>Urgency level (High, Medium, Low)</li>
                      <li>Budget (optional)</li>
                    </ul>
                  </li>
                  <li>Submit your request</li>
                </ol>
                <h4 className="subTitle">Responding to Requests:</h4>
                <ol className="stepsList">
                  <li>Browse available requests</li>
                  <li>Click on a request to see details</li>
                  <li>Fill out the response form with your message</li>
                  <li>Submit your response</li>
                </ol>
                <h4 className="subTitle">Finding Helpers:</h4>
                <ol className="stepsList">
                  <li>Go to <Link to="/helpboard/users">Nearby Helpers</Link></li>
                  <li>Allow location access to find nearby professionals</li>
                  <li>Search by trade if needed</li>
                  <li>View helper profiles with experience and rates</li>
                </ol>
              </div>
            )}
          </div>

          {/* Profile Management */}
          <div className="guideCard">
            <div 
              className="guideHeader"
              onClick={() => toggleSection('profile')}
            >
              <h3 className="guideTitle">👤 Profile Management</h3>
              <span className="expandIcon">
                {expandedSection === 'profile' ? '▼' : '▶'}
              </span>
            </div>
            {expandedSection === 'profile' && (
              <div className="guideContent">
                <h4 className="subTitle">Editing Your Profile:</h4>
                <ol className="stepsList">
                  <li>Go to <Link to="/profile">Your Profile</Link></li>
                  <li>Click "Edit Profile" button</li>
                  <li>Update your username, default phone, or other contact info</li>
                  <li>Click "Save Changes"</li>
                </ol>
                <h4 className="subTitle">Default Contact Information:</h4>
                <ul className="stepsList">
                  <li>Set your default phone number and other contact info in your profile</li>
                  <li>When creating alerts, check "Allow contacting me" to auto-fill this information</li>
                  <li>This saves time when creating multiple alerts</li>
                </ul>
                <h4 className="subTitle">Viewing Your Contributions:</h4>
                <ul className="stepsList">
                  <li>Your profile shows statistics of all your contributions:
                    <ul className="subList">
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
          <div className="guideCard">
            <div 
              className="guideHeader"
              onClick={() => toggleSection('premium')}
            >
              <h3 className="guideTitle">⭐ Premium Features</h3>
              <span className="expandIcon">
                {expandedSection === 'premium' ? '▼' : '▶'}
              </span>
            </div>
            {expandedSection === 'premium' && (
              <div className="guideContent">
                <h4 className="subTitle">Premium Benefits:</h4>
                <ul className="stepsList">
                  <li>✅ Create promoted events</li>
                  <li>✅ Highlight or boost visibility of content</li>
                  <li>✅ Access advanced stats and dashboards</li>
                  <li>✅ Additional premium-only UI sections</li>
                  <li>✅ Premium badge (⭐) next to your username</li>
                </ul>
                <h4 className="subTitle">How to Upgrade:</h4>
                <ol className="stepsList">
                  <li>Go to <Link to="/profile">Your Profile</Link></li>
                  <li>Scroll to "Manage Premium" section</li>
                  <li>Click "Upgrade to Premium" button</li>
                  <li>Enjoy premium features!</li>
                </ol>
                <h4 className="subTitle">Managing Premium Badge:</h4>
                <ul className="stepsList">
                  <li>Go to <Link to="/settings">Settings</Link></li>
                  <li>Toggle "Show purple star (⭐) next to my username"</li>
                  <li>You'll still have premium features, but the badge won't be visible</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Role Information */}
        <div className="section">
          <h2 className="sectionTitle">🎭 Understanding Roles</h2>
          <div className="rolesGrid">
            <div className="roleCard">
              <div className="roleIcon">👤</div>
              <h3>User</h3>
              <p>Standard account with basic permissions. Can create and manage own content.</p>
            </div>
            <div className="roleCard">
              <div className="roleIcon">✓</div>
              <h3>Trusted User</h3>
              <p>Verified community member. Can edit any content but can only delete own content.</p>
            </div>
            <div className="roleCard">
              <div className="roleIcon">🛡️</div>
              <h3>Moderator</h3>
              <p>Content moderator with delete permissions. Can edit and delete any content.</p>
            </div>
            <div className="roleCard">
              <div className="roleIcon">🏛️</div>
              <h3>Representative</h3>
              <p>Official representative with special privileges for official announcements.</p>
            </div>
            <div className="roleCard">
              <div className="roleIcon">🏢</div>
              <h3>Business Owner</h3>
              <p>Business account with promotional features and business analytics.</p>
            </div>
            <div className="roleCard">
              <div className="roleIcon">👑</div>
              <h3>Admin</h3>
              <p>System administrator with full access including user management.</p>
            </div>
          </div>
        </div>

        {/* Tips and Best Practices */}
        <div className="section">
          <h2 className="sectionTitle">💡 Tips & Best Practices</h2>
          <div className="tipsGrid">
            <div className="tipCard">
              <h4>📝 Creating Effective Alerts</h4>
              <ul className="tipsList">
                <li>Be specific about location (street name, landmark, sector)</li>
                <li>Include time-sensitive information</li>
                <li>Use appropriate priority levels</li>
                <li>Provide contact information if you want to be reached</li>
              </ul>
            </div>
            <div className="tipCard">
              <h4>🔒 Privacy & Security</h4>
              <ul className="tipsList">
                <li>Contact info is optional - only share if comfortable</li>
                <li>You can toggle premium badge visibility in settings</li>
                <li>Edit or delete your content anytime</li>
                <li>Report inappropriate content to moderators</li>
              </ul>
            </div>
            <div className="tipCard">
              <h4>⚡ Quick Actions</h4>
              <ul className="tipsList">
                <li>Use voice input for faster alert creation</li>
                <li>Set default contact info in profile for convenience</li>
                <li>Bookmark frequently used pages</li>
                <li>Check your profile for contribution statistics</li>
              </ul>
            </div>
            <div className="tipCard">
              <h4>🤝 Community Guidelines</h4>
              <ul className="tipsList">
                <li>Be respectful and helpful</li>
                <li>Provide accurate information</li>
                <li>Update or delete outdated content</li>
                <li>Help moderate by reporting issues</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature Reference Table */}
        <div className="section">
          <h2 className="sectionTitle">📖 Feature Reference</h2>
          <div className="tableContainer">
            <table className="featureTable">
              <thead>
                <tr>
                  <th className="tableHeader">Feature</th>
                  <th className="tableHeader">Description</th>
                  <th className="tableHeader">Access</th>
                </tr>
              </thead>
              <tbody>
                <tr className="tableRow">
                  <td className="tableCell"><strong>CityPulse</strong></td>
                  <td className="tableCell">Community incident reporting platform for Bucharest</td>
                  <td className="tableCell">Public (create requires login)</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell"><strong>Helpboard</strong></td>
                  <td className="tableCell">Find local professionals and request help</td>
                  <td className="tableCell">Public (create requires login)</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell"><strong>ClarifAI</strong></td>
                  <td className="tableCell">Simplify complex medical and legal documents</td>
                  <td className="tableCell">Public (view-only)</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell"><strong>Public Data Hub</strong></td>
                  <td className="tableCell">Explore government data and social benefits</td>
                  <td className="tableCell">Public (view-only)</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell"><strong>Profile</strong></td>
                  <td className="tableCell">View contributions, manage account, upgrade premium</td>
                  <td className="tableCell">Login required</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell"><strong>Settings</strong></td>
                  <td className="tableCell">Manage preferences and premium badge visibility</td>
                  <td className="tableCell">Login required</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell"><strong>Edit/Delete Content</strong></td>
                  <td className="tableCell">Edit own content; Trusted+ can edit any; Moderators+ can delete any</td>
                  <td className="tableCell">Based on role</td>
                </tr>
                <tr className="tableRow">
                  <td className="tableCell"><strong>Premium Features</strong></td>
                  <td className="tableCell">Promoted events, content highlighting, advanced analytics</td>
                  <td className="tableCell">Premium subscription</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="section">
          <h2 className="sectionTitle">🔍 Quick Reference</h2>
          <div className="referenceGrid">
            <div className="referenceCard">
              <h4>Need Help?</h4>
              <p>Check the tutorials above or contact support</p>
            </div>
            <div className="referenceCard">
              <h4>Want to Contribute?</h4>
              <p>Create alerts, help requests, or respond to others</p>
            </div>
            <div className="referenceCard">
              <h4>Want More Features?</h4>
              <p>Upgrade to Premium in your <Link to="/profile">Profile</Link></p>
            </div>
            <div className="referenceCard">
              <h4>Have Questions?</h4>
              <p>Review the permissions table and role descriptions above</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

