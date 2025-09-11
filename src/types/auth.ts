/**
 * Authentication types for the Altus 4 SDK
 */

import type { UserRole } from './common';

/**
 * User interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  connectedDatabases: string[];
  createdAt: Date;
  lastActive: Date;
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Registration request
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  expiresIn?: number;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
