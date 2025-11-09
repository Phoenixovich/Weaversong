import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

export const useRoleGuard = () => {
  const { user } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user?.role ? roles.includes(user.role) : false;
  };

  const isModerator = (): boolean => {
    return hasAnyRole([UserRole.MODERATOR, UserRole.ADMIN]);
  };

  const isAdmin = (): boolean => {
    return hasRole(UserRole.ADMIN);
  };

  const isBusinessOwner = (): boolean => {
    return hasRole(UserRole.BUSINESS_OWNER);
  };

  const isRepresentative = (): boolean => {
    return hasRole(UserRole.REPRESENTATIVE);
  };

  const isTrusted = (): boolean => {
    return hasAnyRole([UserRole.TRUSTED_USER, UserRole.MODERATOR, UserRole.ADMIN]);
  };

  return {
    hasRole,
    hasAnyRole,
    isModerator,
    isAdmin,
    isBusinessOwner,
    isRepresentative,
    isTrusted,
    currentRole: user?.role || UserRole.USER,
  };
};

