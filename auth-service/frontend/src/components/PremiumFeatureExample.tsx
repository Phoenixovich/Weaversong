import React from 'react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { AuthActionButton } from './AuthActionButton';
import './PremiumFeatureExample.css';

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
    <div className="container">
      <h2>Premium Features Example</h2>
      
      <div className="section">
        <h3>Standard Features (Requires Login)</h3>
        <p>These features are available to all logged-in users:</p>
        <button onClick={handleCreateEvent} className="button">
          Create Event
        </button>
      </div>

      <div className="section">
        <h3>Premium Features (Requires Premium Subscription)</h3>
        <p>These features are only available to premium users:</p>
        <div className="buttonGroup">
          <AuthActionButton
            onClick={handlePromoteEvent}
            requiresPremium={true}
            className="button"
          >
            Promote Event
          </AuthActionButton>
          
          <AuthActionButton
            onClick={handleBoostVisibility}
            requiresPremium={true}
            className="button"
          >
            Boost Visibility
          </AuthActionButton>
        </div>
      </div>

      <div className="status">
        <p>Status: {isAuthenticated ? 'Logged in' : 'Not logged in'}</p>
        {isAuthenticated && (
          <p>Premium: {isPremium ? 'Yes' : 'No'}</p>
        )}
      </div>
    </div>
  );
};


