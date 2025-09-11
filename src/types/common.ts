/**
 * Common types used across the Altus 4 SDK
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'user';

/**
 * Environment types
 */
export type Environment = 'test' | 'live';

/**
 * Rate limiting tiers
 */
export type RateLimitTier = 'free' | 'pro' | 'enterprise';

/**
 * Time periods for analytics
 */
export type Period = 'day' | 'week' | 'month' | 'year';

/**
 * Search modes
 */
export type SearchMode = 'natural' | 'boolean' | 'semantic';

/**
 * Error codes
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
