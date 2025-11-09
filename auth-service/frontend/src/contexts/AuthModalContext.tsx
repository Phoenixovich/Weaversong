import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AuthModalContextType {
  showLoginModal: () => void;
  showUpgradeModal: () => void;
  closeLoginModal: () => void;
  closeUpgradeModal: () => void;
  isLoginModalOpen: boolean;
  isUpgradeModalOpen: boolean;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

interface AuthModalProviderProps {
  children: ReactNode;
}

export const AuthModalProvider: React.FC<AuthModalProviderProps> = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const showLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const showUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false);
  }, []);

  const value: AuthModalContextType = {
    showLoginModal,
    showUpgradeModal,
    closeLoginModal,
    closeUpgradeModal,
    isLoginModalOpen,
    isUpgradeModalOpen,
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
};

