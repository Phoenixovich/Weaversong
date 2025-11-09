import React from 'react';
import { LoginModal } from './LoginModal';
import { UpgradeModal } from './UpgradeModal';
import { useAuthModal } from '../contexts/AuthModalContext';

interface AuthModalProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that manages login and upgrade modals globally
 * Use useAuthGuard hook in child components to trigger these modals
 */
export const AuthModalProvider: React.FC<AuthModalProviderProps> = ({ children }) => {
  const {
    isLoginModalOpen,
    isUpgradeModalOpen,
    closeLoginModal,
    closeUpgradeModal,
  } = useAuthModal();

  return (
    <>
      {children}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onSuccess={closeLoginModal}
      />
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={closeUpgradeModal}
      />
    </>
  );
};

