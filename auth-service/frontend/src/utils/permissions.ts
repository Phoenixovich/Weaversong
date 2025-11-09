/**
 * Frontend permission checking utilities
 * These mirror the backend permission logic
 */
import { User, UserRole } from '../types/auth';

export function canEditAlert(user: User | null, alertUserId: string): boolean {
  if (!user) return false;
  
  // User can always edit their own content
  if (user.id === alertUserId) return true;
  
  // Trusted users and above can edit any alert
  if (user.role && [
    UserRole.TRUSTED_USER,
    UserRole.MODERATOR,
    UserRole.REPRESENTATIVE,
    UserRole.BUSINESS_OWNER,
    UserRole.ADMIN
  ].includes(user.role)) {
    return true;
  }
  
  return false;
}

export function canDeleteAlert(user: User | null, alertUserId: string): boolean {
  if (!user) return false;
  
  // User can always delete their own content
  if (user.id === alertUserId) return true;
  
  // Moderators and above can delete any alert
  if (user.role && [
    UserRole.MODERATOR,
    UserRole.ADMIN
  ].includes(user.role)) {
    return true;
  }
  
  return false;
}

export function canEditRequest(user: User | null, requestUserId: string): boolean {
  if (!user) return false;
  
  // Only the request owner can edit their request
  return user.id === requestUserId;
}

export function canAcceptResponse(user: User | null, requestUserId: string): boolean {
  if (!user) return false;
  
  // Only the request owner can accept/decline responses
  return user.id === requestUserId;
}

export function canDeleteRequest(user: User | null, requestUserId: string): boolean {
  if (!user) return false;
  
  // User can always delete their own content
  if (user.id === requestUserId) return true;
  
  // Moderators and above can delete any request
  if (user.role && [
    UserRole.MODERATOR,
    UserRole.ADMIN
  ].includes(user.role)) {
    return true;
  }
  
  return false;
}

export function canEditResponse(user: User | null, responseUserId: string): boolean {
  if (!user) return false;
  
  // User can always edit their own content
  if (user.id === responseUserId) return true;
  
  // Trusted users and above can edit any response
  if (user.role && [
    UserRole.TRUSTED_USER,
    UserRole.MODERATOR,
    UserRole.REPRESENTATIVE,
    UserRole.BUSINESS_OWNER,
    UserRole.ADMIN
  ].includes(user.role)) {
    return true;
  }
  
  return false;
}

export function canDeleteResponse(user: User | null, responseUserId: string): boolean {
  if (!user) return false;
  
  // User can always delete their own content
  if (user.id === responseUserId) return true;
  
  // Moderators and above can delete any response
  if (user.role && [
    UserRole.MODERATOR,
    UserRole.ADMIN
  ].includes(user.role)) {
    return true;
  }
  
  return false;
}


