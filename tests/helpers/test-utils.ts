/**
 * Test utilities for integration tests
 */

import { Altus4SDK } from '../../src';
import { MockAltus4Server } from './test-server';

export interface TestContext {
  sdk: Altus4SDK;
  server: MockAltus4Server;
  baseUrl: string;
}

/**
 * Creates a test context with a mock server and SDK instance
 */
export async function createTestContext(): Promise<TestContext> {
  const server = new MockAltus4Server();
  server.setupDefaultEndpoints();
  server.clearState(); // Reset state for each test

  const baseUrl = await server.start();

  const sdk = new Altus4SDK({
    baseURL: baseUrl,
    timeout: 5000,
  });

  return { sdk, server, baseUrl };
}

/**
 * Cleans up test context
 */
export async function cleanupTestContext(context: TestContext): Promise<void> {
  await context.server.stop();
}

/**
 * Waits for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await wait(delay);
    }
  }

  throw lastError!;
}

/**
 * Test data generators
 */
export const TestData = {
  user: {
    email: 'test@altus4.example.com',
    password: 'test-password-123',
    name: 'Test User',
  },

  apiKey: {
    name: 'Test API Key',
    environment: 'test' as const,
    permissions: ['search', 'analytics'] as const,
  },

  database: {
    name: 'Test Database',
    host: 'localhost',
    port: 3306,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
  },

  analyticsQuery: {
    period: 'week' as const,
    startDate: '2023-01-01',
    endDate: '2023-01-07',
  },
};

/**
 * Assertion helpers
 */
export const Assertions = {
  isValidApiResponse: (response: any) => {
    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    expect(response).toHaveProperty('success');
    expect(typeof response.success).toBe('boolean');

    if (response.success) {
      // Some responses have data property (standard API responses)
      // Others have the data directly in the response (auth results)
      // Others are just {success: true} (logout responses)
      const hasDataProperty = Object.prototype.hasOwnProperty.call(response, 'data');
      const hasDirectData =
        Object.prototype.hasOwnProperty.call(response, 'user') ||
        Object.prototype.hasOwnProperty.call(response, 'token');
      const isSimpleSuccess = Object.keys(response).length === 1 && response.success;
      expect(hasDataProperty || hasDirectData || isSimpleSuccess).toBe(true);
    } else {
      expect(response).toHaveProperty('error');
    }
  },

  isValidUser: (user: any) => {
    expect(user).toBeDefined();
    expect(typeof user).toBe('object');
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(typeof user.id).toBe('string');
    expect(typeof user.email).toBe('string');
  },

  isValidToken: (token: string) => {
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  },

  isValidApiKey: (apiKey: any) => {
    expect(apiKey).toBeDefined();
    expect(typeof apiKey).toBe('object');
    expect(apiKey).toHaveProperty('id');
    expect(apiKey).toHaveProperty('key');
    expect(apiKey).toHaveProperty('name');
    expect(apiKey).toHaveProperty('environment');
    expect(apiKey).toHaveProperty('permissions');
    expect(Array.isArray(apiKey.permissions)).toBe(true);
  },

  isValidDatabase: (database: any) => {
    expect(database).toBeDefined();
    expect(typeof database).toBe('object');
    expect(database).toHaveProperty('id');
    expect(database).toHaveProperty('name');
    expect(database).toHaveProperty('host');
    expect(database).toHaveProperty('port');
    expect(database).toHaveProperty('status');
  },
};

/**
 * Mock network conditions for testing resilience
 */
export class NetworkSimulator {
  private originalFetch: any;

  simulateSlowNetwork(_delay: number = 1000) {
    // Reference parameter to avoid unused variable lint
    void _delay;
    // This would typically intercept HTTP calls and add delays
    // For now, we can use the delay feature in our mock server
  }

  simulateNetworkError() {
    // This would simulate network failures
    // Implementation depends on the HTTP client being used
  }

  simulateIntermittentConnectivity() {
    // This would randomly fail some requests
  }

  reset() {
    // Reset to normal network conditions
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceMeasurer {
  private startTime: number = 0;

  start() {
    this.startTime = Date.now();
  }

  stop(): number {
    return Date.now() - this.startTime;
  }

  async measure<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;

    return { result, duration };
  }
}

/**
 * Environment detection
 */
export const Environment = {
  isCI: () => process.env.CI === 'true',
  isLocal: () => !process.env.CI,
  getTestMode: () => process.env.ALTUS4_TEST_MODE || 'mock',
  shouldUseRealAPI: () => process.env.ALTUS4_TEST_MODE === 'real',
};
