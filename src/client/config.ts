/**
 * Configuration constants and defaults for the Altus 4 SDK
 */

/**
 * Client configuration interface
 */
export interface ClientConfig {
  /**
   * Base URL for the Altus 4 API
   * @default 'http://localhost:3000/api/v1'
   */
  baseURL?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Additional headers to include with requests
   */
  headers?: Record<string, string>;

  /**
   * API key for authentication (alternative to JWT)
   */
  apiKey?: string;

  /**
   * Enable debug mode for additional logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<Omit<ClientConfig, 'apiKey'>> = {
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {},
  debug: false,
};
