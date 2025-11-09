import React from 'react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { AuthActionButton } from './AuthActionButton';

/**
 * Example component demonstrating how to use auth guards for premium features
 * This shows how to:
 * 1. Use requireAuth for login-required actions
 * 2. Use requireAuth with requiresPremium=true for premium-only actions
 * 3. Use AuthActionButton to show appropriate button text based on user status
 */
export const PremiumFeatureExample: React.FC = () => {
  const { requireAuth, isAuthenticated, isPremium } = useAuthGuard();

  const handleCreateEvent = () => {
    // This requires login (standard user)
    requireAuth(() => {
      console.log('Creating event...');
      // Your create event logic here
    });
  };

  const handlePromoteEvent = () => {
    // This requires premium subscription
    requireAuth(() => {
      console.log('Promoting event...');
      // Your promote event logic here
    }, true); // requiresPremium = true
  };

  const handleBoostVisibility = () => {
    // This requires premium subscription
    requireAuth(() => {
      console.log('Boosting visibility...');
      // Your boost visibility logic here
    }, true); // requiresPremium = true
  };

  return (
    <div style={styles.container}>
      <h2>Premium Features Example</h2>
      
      <div style={styles.section}>
        <h3>Standard Features (Requires Login)</h3>
        <p>These features are available to all logged-in users:</p>
        <button onClick={handleCreateEvent} style={styles.button}>
          Create Event
        </button>
      </div>

      <div style={styles.section}>
        <h3>Premium Features (Requires Premium Subscription)</h3>
        <p>These features are only available to premium users:</p>
        <div style={styles.buttonGroup}>
          <AuthActionButton
            onClick={handlePromoteEvent}
            requiresPremium={true}
            style={styles.button}
          >
            Promote Event
          </AuthActionButton>
          
          <AuthActionButton
            onClick={handleBoostVisibility}
            requiresPremium={true}
            style={styles.button}
          >
            Boost Visibility
          </AuthActionButton>
        </div>
      </div>

      <div style={styles.status}>
        <p>Status: {isAuthenticated ? 'Logged in' : 'Not logged in'}</p>
        {isAuthenticated && (
          <p>Premium: {isPremium ? 'Yes' : 'No'}</p>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  section: {
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  status: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
  },
};

