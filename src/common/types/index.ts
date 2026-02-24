// ==============================
// Roles
// ==============================
export type UserRole = 'contractor' | 'supplier' | 'admin';
export const USER_ROLES: UserRole[] = ['contractor', 'supplier', 'admin'];

// ==============================
// User Status
// ==============================
export type UserStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending_verification';
export const USER_STATUSES: UserStatus[] = [
  'active',
  'inactive',
  'suspended',
  'pending_verification',
];

// ==============================
// Profile
// ==============================
export type ProfileType = UserRole;
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export const VERIFICATION_STATUSES: VerificationStatus[] = [
  'pending',
  'verified',
  'rejected',
];

// ==============================
// Auth — Response Types
// ==============================
export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
}

export interface LoginResponse extends AuthTokens {
  user: UserSummary | null;
}

export interface RegisterResponse {
  message: string;
  user: UserSummary;
}

export interface RefreshTokenResponse {
  access_token: string;
  id_token?: string;
  expires_in?: number;
}

export interface MessageResponse {
  message: string;
}

// ==============================
// Auth — User Summary (subset of User for responses)
// ==============================
export interface UserSummary {
  user_id: string;
  cognito_username?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
  created_at: string;
}

// ==============================
// Auth — JWT / Request Types
// ==============================
export interface JwtPayload {
  sub: string;
  email?: string;
  username?: string;
  'cognito:username'?: string;
  'cognito:groups'?: string[];
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
  groups: UserRole[];
  role: UserRole | '';
}
