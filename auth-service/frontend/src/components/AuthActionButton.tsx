import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthActionButtonProps {
  onClick: () => void;
  requiresPremium?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

/**
 * Button component that shows appropriate text based on user authentication and premium status
 * and handles click events with auth guards
 */
export const AuthActionButton: React.FC<AuthActionButtonProps> = ({
  onClick,
  requiresPremium = false,
  children,
  className,
  style,
  disabled,
}) => {
  const { isAuthenticated, isPremium } = useAuth();

  const getButtonText = () => {
    if (!isAuthenticated) {
      return 'Login to use';
    }
    if (requiresPremium && !isPremium) {
      return 'Upgrade to use';
    }
    return children;
  };

  const isDisabled = disabled || (!isAuthenticated && requiresPremium) || (requiresPremium && !isPremium);

  return (
    <button
      onClick={onClick}
      className={className}
      style={style}
      disabled={isDisabled}
      title={
        !isAuthenticated
          ? 'Login required'
          : requiresPremium && !isPremium
          ? 'Premium subscription required'
          : undefined
      }
    >
      {getButtonText()}
    </button>
  );
};

