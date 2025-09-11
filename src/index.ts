/**
 * SDK package entrypoint - re-export client, services and types
 */

export * from './client';
export * from './services';
export * from './types';
/**
 * Altus 4 SDK
 *
 * A comprehensive TypeScript SDK for the Altus 4 API.
 * Provides a unified interface for authentication, API key management,
 * database connections, analytics, and system management.
 *
 * @example
 * ```typescript
 * import { Altus4SDK } from './sdk';
 *
 * // Initialize the SDK
 * const altus4 = new Altus4SDK({
 *   baseURL: 'https://api.altus4.com/v1'
 * });
 *
 * // Authenticate
 * const loginResult = await altus4.auth.handleLogin({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 *
 * if (loginResult.success) {
 *   // Create API key
 *   const apiKey = await altus4.apiKeys.createApiKey({
 *     name: 'My API Key',
 *     environment: 'test',
 *     permissions: ['search', 'analytics']
 *   });
 *
 *   // Add database connection
 *   const database = await altus4.database.addDatabaseConnection({
 *     name: 'My Database',
 *     host: 'localhost',
 *     port: 3306,
 *     database: 'mydb',
 *     username: 'user',
 *     password: 'pass'
 *   });
 *
 *   // Get analytics
 *   const dashboard = await altus4.analytics.getDashboardAnalytics({
 *     period: 'week'
 *   });
 * }
 * ```
 */

import {
  AnalyticsService,
  ApiKeysService,
  AuthService,
  DatabaseService,
  ManagementService,
} from './services';
import type { ClientConfig } from './types';

// Re-export all types for convenience
export * from './types';

// Re-export utilities for convenience
export * from './utils';

// Re-export individual services for advanced usage
export {
  AnalyticsService,
  ApiKeysService,
  AuthService,
  DatabaseService,
  ManagementService,
} from './services';

// Re-export base client for custom implementations
export { BaseClient } from './client';

/**
 * Main Altus 4 SDK class that provides a unified interface to all services
 */
export class Altus4SDK {
  /**
   * Authentication service for user management
   */
  public readonly auth: AuthService;

  /**
   * API Keys service for key management
   */
  public readonly apiKeys: ApiKeysService;

  /**
   * Database service for connection management
   */
  public readonly database: DatabaseService;

  /**
   * Analytics service for search insights and metrics
   */
  public readonly analytics: AnalyticsService;

  /**
   * Management service for system operations
   */
  public readonly management: ManagementService;

  /**
   * Initialize the Altus 4 SDK
   *
   * @param config - Configuration options for the SDK
   */
  constructor(config: ClientConfig = {}) {
    // Initialize all services with the same configuration
    this.auth = new AuthService(config);
    this.apiKeys = new ApiKeysService(config);
    this.database = new DatabaseService(config);
    this.analytics = new AnalyticsService(config);
    this.management = new ManagementService(config);
  }

  /**
   * Check if the user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  /**
   * Set authentication token manually
   */
  setToken(token: string, expiresIn?: number): void {
    this.auth.setToken(token, expiresIn);
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.auth.clearToken();
  }

  /**
   * Test connection to the API
   */
  async testConnection() {
    return this.management.testConnection();
  }

  /**
   * Get the base URL being used by the SDK
   */
  getBaseURL(): string {
    return this.auth.getBaseURL();
  }

  /**
   * Update the base URL for all services
   */
  setBaseURL(baseURL: string): void {
    this.auth.setBaseURL(baseURL);
    this.apiKeys.setBaseURL(baseURL);
    this.database.setBaseURL(baseURL);
    this.analytics.setBaseURL(baseURL);
    this.management.setBaseURL(baseURL);
  }

  // Convenience methods that delegate to individual services

  /**
   * Quick login helper
   */
  async login(email: string, password: string) {
    return this.auth.handleLogin({ email, password });
  }

  /**
   * Quick register helper
   */
  async register(name: string, email: string, password: string) {
    return this.auth.handleRegister({ name, email, password });
  }

  /**
   * Quick logout helper
   */
  async logout() {
    return this.auth.handleLogout();
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    return this.auth.getCurrentUser();
  }

  /**
   * Check if current user is admin
   */
  async isAdmin() {
    return this.auth.isAdmin();
  }

  /**
   * Refresh authentication token if needed
   */
  async refreshTokenIfNeeded() {
    return this.auth.refreshTokenIfNeeded();
  }
}

/**
 * Create a new Altus 4 SDK instance
 *
 * @param config - Configuration options for the SDK
 * @returns New SDK instance
 */
export function createAltus4SDK(config?: ClientConfig): Altus4SDK {
  return new Altus4SDK(config);
}

/**
 * Default SDK instance for convenience
 *
 * @example
 * ```typescript
 * import { altus4 } from './sdk';
 *
 * const user = await altus4.auth.getCurrentUser();
 * ```
 */
export const altus4 = new Altus4SDK();

// Default export is the SDK class
export default Altus4SDK;
