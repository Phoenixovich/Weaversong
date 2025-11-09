import React from 'react';
import { User, UserRole } from '../types/auth';

interface UserBadgeProps {
  user: User;
  showRole?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const roleEmojis: Record<UserRole, string> = {
  [UserRole.USER]: '',
  [UserRole.TRUSTED_USER]: '✓',
  [UserRole.MODERATOR]: '🛡️',
  [UserRole.REPRESENTATIVE]: '🏛️',
  [UserRole.BUSINESS_OWNER]: '🏢',
  [UserRole.ADMIN]: '👑',
};

const roleColors: Record<UserRole, string> = {
  [UserRole.USER]: '#666',
  [UserRole.TRUSTED_USER]: '#4CAF50',
  [UserRole.MODERATOR]: '#2196F3',
  [UserRole.REPRESENTATIVE]: '#9C27B0',
  [UserRole.BUSINESS_OWNER]: '#FF9800',
  [UserRole.ADMIN]: '#F44336',
};

export const UserBadge: React.FC<UserBadgeProps> = ({ 
  user, 
  showRole = true,
  size = 'medium' 
}) => {
  const role = user.role || UserRole.USER;
  const showPremium = user.is_premium && user.show_premium_badge !== false;
  
  const sizeStyles = {
    small: { fontSize: '0.75rem', gap: '0.25rem' },
    medium: { fontSize: '0.9rem', gap: '0.4rem' },
    large: { fontSize: '1.1rem', gap: '0.5rem' },
  };

  const style = sizeStyles[size];

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: style.gap }}>
      {showPremium && (
        <span 
          style={{ 
            fontSize: style.fontSize,
            filter: 'drop-shadow(0 0 2px rgba(156, 39, 176, 0.5))',
            color: '#9C27B0',
          }}
          title="Premium Member"
        >
          ⭐
        </span>
      )}
      <span>{user.name || user.username}</span>
      {showRole && role !== UserRole.USER && (
        <span
          style={{
            fontSize: style.fontSize,
            color: roleColors[role],
            marginLeft: '0.25rem',
          }}
          title={role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        >
          {roleEmojis[role]}
        </span>
      )}
    </span>
  );
};

