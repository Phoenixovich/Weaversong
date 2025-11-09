import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';

interface UseAuthGuardReturn {
  requireAuth: (action: () => void, requiresPremium?: boolean) => void;
  isAuthenticated: boolean;
  isPremium: boolean;
}

/**
 * Hook to guard actions that require authentication or premium subscription
 * 
 * @example
 * const { requireAuth } = useAuthGuard();
 * 
 * const handleCreateEvent = () => {
 *   requireAuth(() => {
 *     // Action that requires login
 *     createEvent();
 *   });
 * };
 * 
 * const handlePromoteEvent = () => {
 *   requireAuth(() => {
 *     // Action that requires premium
 *     promoteEvent();
 *   }, true);
 * };
 */
export const useAuthGuard = (): UseAuthGuardReturn => {
  const { user, isAuthenticated } = useAuth();
  const { showLoginModal, showUpgradeModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();

  const isPremium = user?.is_premium === true;

  const requireAuth = useCallback(
    (action: () => void, requiresPremium: boolean = false) => {
      // If not authenticated, redirect to login page if on CityPulse, otherwise show modal
      if (!isAuthenticated) {
        if (location.pathname === '/citypulse') {
          navigate('/login');
          return;
        }
        showLoginModal();
        return;
      }

      // If authenticated but requires premium and user is not premium, show upgrade modal
      if (requiresPremium && !isPremium) {
        showUpgradeModal();
        return;
      }

      // All checks passed, execute the action
      action();
    },
    [isAuthenticated, isPremium, showLoginModal, showUpgradeModal, navigate, location.pathname]
  );

  return {
    requireAuth,
    isAuthenticated,
    isPremium,
  };
};

