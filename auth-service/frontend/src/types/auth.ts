export enum UserRole {
  USER = "user",
  TRUSTED_USER = "trusted_user",
  MODERATOR = "moderator",
  REPRESENTATIVE = "representative",
  BUSINESS_OWNER = "business_owner",
  ADMIN = "admin",
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  date_created: string;
  is_premium?: boolean;
  role?: UserRole;
  show_premium_badge?: boolean;
  default_phone?: string;
  default_other_contact?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  username: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

