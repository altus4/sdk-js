/**
 * Validation utilities for the Altus 4 SDK
 */

import type {
  AddDatabaseConnectionRequest,
  CreateApiKeyRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from '../types';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password strength requirements
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user registration data
 */
export function validateRegistration(userData: RegisterRequest): ValidationResult {
  const errors: string[] = [];

  // Validate name
  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Validate email
  if (!userData.email || !validateEmail(userData.email)) {
    errors.push('Valid email address is required');
  }

  // Validate password
  const passwordValidation = validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  // Validate role if provided
  if (userData.role && !['admin', 'user'].includes(userData.role)) {
    errors.push('Role must be either "admin" or "user"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate profile update data
 */
export function validateProfileUpdate(profileData: UpdateProfileRequest): ValidationResult {
  const errors: string[] = [];

  // Validate name if provided
  if (profileData.name !== undefined) {
    if (!profileData.name || profileData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
  }

  // Validate email if provided
  if (profileData.email !== undefined) {
    if (!profileData.email || !validateEmail(profileData.email)) {
      errors.push('Valid email address is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate API key creation data
 */
export function validateApiKeyCreation(keyData: CreateApiKeyRequest): ValidationResult {
  const errors: string[] = [];

  // Validate name
  if (!keyData.name || keyData.name.trim().length < 3) {
    errors.push('API key name must be at least 3 characters long');
  }

  // Validate environment
  if (!['test', 'live'].includes(keyData.environment)) {
    errors.push('Environment must be either "test" or "live"');
  }

  // Validate permissions
  if (keyData.permissions && keyData.permissions.length > 0) {
    const validPermissions = ['search', 'analytics', 'admin'];
    const invalidPerms = keyData.permissions.filter((p: string) => !validPermissions.includes(p));
    if (invalidPerms.length > 0) {
      errors.push(`Invalid permissions: ${invalidPerms.join(', ')}`);
    }
  }

  // Validate rate limit tier
  if (keyData.rateLimitTier && !['free', 'pro', 'enterprise'].includes(keyData.rateLimitTier)) {
    errors.push('Rate limit tier must be "free", "pro", or "enterprise"');
  }

  // Validate expiration date if provided
  if (keyData.expiresAt) {
    const expirationDate = new Date(keyData.expiresAt);
    if (isNaN(expirationDate.getTime())) {
      errors.push('Invalid expiration date format');
    } else if (expirationDate <= new Date()) {
      errors.push('Expiration date must be in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate database connection data
 */
export function validateDatabaseConnection(
  connectionData: AddDatabaseConnectionRequest
): ValidationResult {
  const errors: string[] = [];

  // Validate name
  if (!connectionData.name || connectionData.name.trim().length < 1) {
    errors.push('Connection name is required');
  }

  // Validate host
  if (!connectionData.host || connectionData.host.trim().length < 1) {
    errors.push('Host is required');
  }

  // Validate port
  if (!connectionData.port || connectionData.port < 1 || connectionData.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }

  // Validate database name
  if (!connectionData.database || connectionData.database.trim().length < 1) {
    errors.push('Database name is required');
  }

  // Validate username
  if (!connectionData.username || connectionData.username.trim().length < 1) {
    errors.push('Username is required');
  }

  // Password can be empty for local development, so no validation

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate port number
 */
export function validatePort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function validateDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Sanitize string input (remove potentially harmful characters)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .trim();
}

/**
 * Validate and sanitize search query
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];

  if (!query || query.trim().length === 0) {
    errors.push('Search query cannot be empty');
  }

  if (query.length > 500) {
    errors.push('Search query cannot exceed 500 characters');
  }

  // Check for potential SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(--|\*\/|\*)/,
    /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i,
  ];

  const hasSqlInjection = sqlInjectionPatterns.some(pattern => pattern.test(query));
  if (hasSqlInjection) {
    errors.push('Query contains potentially harmful content');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
export * from './validators';
