/**
 * API Key management types for the Altus 4 SDK
 */

import type { Environment, RateLimitTier } from './common';

/**
 * API Key entity
 */
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  environment: Environment;
  permissions: string[];
  rateLimitTier: RateLimitTier;
  expiresAt?: string;
  lastUsed?: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload for creating a new API key
 */
export interface CreateApiKeyRequest {
  name: string;
  environment: Environment;
  permissions?: string[];
  rateLimitTier?: RateLimitTier;
  expiresAt?: string;
}

/**
 * Response when creating a new API key (includes the secret)
 */
export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  secretKey: string;
  warning: string;
}

/**
 * Request payload for updating an API key
 */
export interface UpdateApiKeyRequest {
  name?: string;
  permissions?: string[];
  rateLimitTier?: RateLimitTier;
  expiresAt?: string;
}

/**
 * API Key usage statistics
 */
export interface ApiKeyUsage {
  keyId: string;
  totalRequests: number;
  requestsThisMonth: number;
  lastUsed?: string;
  rateLimitTier: RateLimitTier;
  quotaUsed: number;
  quotaLimit: number;
}

/**
 * Rate limit information for display
 */
export interface RateLimitInfo {
  limit: number;
  name: string;
  description: string;
}
