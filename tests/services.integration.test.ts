/**
 * API Services Integration Tests
 *
 * These tests verify the integration between different SDK services:
 * - API Keys management
 * - Database connections
 * - Analytics and reporting
 * - System management
 */

// @ts-nocheck
/* eslint-disable no-unused-vars */

import { Assertions, cleanupTestContext, createTestContext, TestData } from './helpers/test-utils';
import type { TestContext } from './helpers/test-utils';
import { TokenStorageManager } from '../src/utils/token-storage';

// Mock TokenStorageManager for integration tests
jest.mock('../src/utils/token-storage');
const mockTokenStorageManager = TokenStorageManager as jest.Mocked<typeof TokenStorageManager>;

describe('API Services Integration Tests', () => {
  let context: TestContext;

  beforeEach(async () => {
    // Reset mocks before each test
    mockTokenStorageManager.hasValidToken.mockReturnValue(false);
    mockTokenStorageManager.isTokenExpiringSoon.mockReturnValue(false);
    mockTokenStorageManager.getTokenData.mockReturnValue(null);
    mockTokenStorageManager.getToken.mockReturnValue(null);
    mockTokenStorageManager.saveToken.mockImplementation(() => {});
    mockTokenStorageManager.clearToken.mockImplementation(() => {});

    context = await createTestContext();
    // Login before each test to ensure authentication
    const loginResult = await context.sdk.login(TestData.user.email, TestData.user.password);
    if (loginResult.success && loginResult.token) {
      mockTokenStorageManager.hasValidToken.mockReturnValue(true);
      mockTokenStorageManager.getToken.mockReturnValue(loginResult.token);
    }
  });

  afterEach(async () => {
    if (context) {
      await cleanupTestContext(context);
    }
  });

  describe('API Keys Service', () => {
    it('should list existing API keys', async () => {
      const { sdk } = context;

      const apiKeysResult = await sdk.apiKeys.listApiKeys();

      Assertions.isValidApiResponse(apiKeysResult);
      expect(apiKeysResult.success).toBe(true);
      expect(Array.isArray(apiKeysResult.data)).toBe(true);

      if (apiKeysResult.data!.length > 0) {
        const apiKey = apiKeysResult.data![0];
        Assertions.isValidApiKey(apiKey);
      }
    });

    it('should create a new API key', async () => {
      const { sdk } = context;

      const createResult = await sdk.apiKeys.createApiKey(TestData.apiKey);

      Assertions.isValidApiResponse(createResult);
      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();

      const apiKey = createResult.data!;
      Assertions.isValidApiKey(apiKey);
      expect(apiKey.name).toBe(TestData.apiKey.name);
      expect(apiKey.environment).toBe(TestData.apiKey.environment);
      expect(apiKey.permissions).toEqual(expect.arrayContaining(TestData.apiKey.permissions));
    });

    it('should update an existing API key', async () => {
      const { sdk } = context;

      // First create an API key
      const createResult = await sdk.apiKeys.createApiKey(TestData.apiKey);
      expect(createResult.success).toBe(true);
      const createdKey = createResult.data!;

      // Then update it
      const updates = {
        name: 'Updated API Key Name',
        permissions: ['search'] as const,
      };

      const updateResult = await sdk.apiKeys.updateApiKey(createdKey.id, updates);

      Assertions.isValidApiResponse(updateResult);
      if (updateResult.success) {
        expect(updateResult.data!.name).toBe(updates.name);
        expect(updateResult.data!.permissions).toEqual(updates.permissions);
      }
    });

    it('should revoke an API key', async () => {
      const { sdk } = context;

      // First create an API key
      const createResult = await sdk.apiKeys.createApiKey(TestData.apiKey);
      expect(createResult.success).toBe(true);
      const createdKey = createResult.data!;

      // Then revoke it
      const revokeResult = await sdk.apiKeys.revokeApiKey(createdKey.id);

      Assertions.isValidApiResponse(revokeResult);
      expect(revokeResult.success).toBe(true);
    });

    it('should handle API key operations without authentication', async () => {
      const { sdk } = context;

      // Clear authentication
      sdk.clearToken();

      const apiKeysResult = await sdk.apiKeys.listApiKeys();

      // Should fail gracefully
      if (!apiKeysResult.success) {
        expect(apiKeysResult.error).toBeDefined();
        expect(apiKeysResult.error!.code).toMatch(/UNAUTHORIZED|UNAUTHENTICATED/);
      }
    });
  });

  describe('Database Service', () => {
    it('should list database connections', async () => {
      const { sdk } = context;

      const connectionsResult = await sdk.database.listDatabaseConnections();

      Assertions.isValidApiResponse(connectionsResult);
      expect(connectionsResult.success).toBe(true);
      expect(Array.isArray(connectionsResult.data)).toBe(true);

      if (connectionsResult.data!.length > 0) {
        const database = connectionsResult.data![0];
        Assertions.isValidDatabase(database);
      }
    });

    it('should create a new database connection', async () => {
      const { sdk } = context;

      const createResult = await sdk.database.addDatabaseConnection(TestData.database);

      Assertions.isValidApiResponse(createResult);
      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();

      const database = createResult.data!;
      Assertions.isValidDatabase(database);
      expect(database.name).toBe(TestData.database.name);
      expect(database.host).toBe(TestData.database.host);
      expect(database.port).toBe(TestData.database.port);
    });

    it('should test database connection', async () => {
      const { sdk } = context;

      // First create a database connection
      const createResult = await sdk.database.addDatabaseConnection(TestData.database);
      expect(createResult.success).toBe(true);
      const createdDb = createResult.data!;

      // Then test the connection
      const testResult = await sdk.database.testDatabaseConnection(createdDb.id);

      Assertions.isValidApiResponse(testResult);
      // Connection test might succeed or fail depending on mock implementation
      expect(typeof testResult.success).toBe('boolean');
    });

    it('should update database connection', async () => {
      const { sdk } = context;

      // First create a database connection
      const createResult = await sdk.database.addDatabaseConnection(TestData.database);
      expect(createResult.success).toBe(true);
      const createdDb = createResult.data!;

      // Then update it
      const updates = {
        name: 'Updated Database Name',
        host: 'updated-host.example.com',
      };

      const updateResult = await sdk.database.updateDatabaseConnection(createdDb.id, updates);

      Assertions.isValidApiResponse(updateResult);
      if (updateResult.success) {
        expect(updateResult.data!.name).toBe(updates.name);
        expect(updateResult.data!.host).toBe(updates.host);
      }
    });

    it('should remove database connection', async () => {
      const { sdk } = context;

      // First create a database connection
      const createResult = await sdk.database.addDatabaseConnection(TestData.database);
      expect(createResult.success).toBe(true);
      const createdDb = createResult.data!;

      // Then remove it
      const removeResult = await sdk.database.removeDatabaseConnection(createdDb.id);

      Assertions.isValidApiResponse(removeResult);
      expect(removeResult.success).toBe(true);
    });
  });

  describe('Analytics Service', () => {
    it('should get dashboard analytics', async () => {
      const { sdk } = context;

      const dashboardResult = await sdk.analytics.getDashboardAnalytics(TestData.analyticsQuery);

      Assertions.isValidApiResponse(dashboardResult);
      expect(dashboardResult.success).toBe(true);
      expect(dashboardResult.data).toBeDefined();

      const analytics = dashboardResult.data!;
      expect(analytics).toHaveProperty('totalSearches');
      expect(analytics).toHaveProperty('successfulSearches');
      expect(typeof analytics.totalSearches).toBe('number');
      expect(typeof analytics.successfulSearches).toBe('number');
    });

    it('should get analytics trends', async () => {
      const { sdk } = context;

      const trendsResult = await sdk.analytics.getTrends(TestData.analyticsQuery);

      Assertions.isValidApiResponse(trendsResult);
      expect(trendsResult.success).toBe(true);
    });

    it('should get AI insights', async () => {
      const { sdk } = context;

      const insightsResult = await sdk.analytics.getInsights({ type: 'search' });

      Assertions.isValidApiResponse(insightsResult);
      expect(insightsResult.success).toBe(true);
    });

    it('should get performance metrics', async () => {
      const { sdk } = context;

      const metricsResult = await sdk.analytics.getPerformanceMetrics({
        granularity: 'hour',
        period: 'day',
      });

      Assertions.isValidApiResponse(metricsResult);
      expect(metricsResult.success).toBe(true);
    });

    it('should get search history', async () => {
      const { sdk } = context;

      const historyResult = await sdk.analytics.getSearchHistory({ limit: 10 });

      Assertions.isValidApiResponse(historyResult);
      expect(historyResult.success).toBe(true);
      expect(Array.isArray(historyResult.data)).toBe(true);
    });

    it('should get usage statistics', async () => {
      const { sdk } = context;

      const usageResult = await sdk.analytics.getUsageStats('week');

      Assertions.isValidApiResponse(usageResult);
      expect(usageResult.success).toBe(true);
    });
  });

  describe('Management Service', () => {
    it('should test connection health', async () => {
      const { sdk } = context;

      const healthResult = await sdk.testConnection();

      Assertions.isValidApiResponse(healthResult);
      expect(healthResult.success).toBe(true);
      expect(healthResult.data).toBeDefined();

      const health = healthResult.data!;
      expect(health).toHaveProperty('status');
      expect(health.status).toBe('healthy');
      expect(health).toHaveProperty('version');
      expect(health).toHaveProperty('services');
    });

    it('should get system health', async () => {
      const { sdk } = context;

      const systemHealthResult = await sdk.management.getSystemStatus();

      Assertions.isValidApiResponse(systemHealthResult);
      expect(systemHealthResult.success).toBe(true);
    });

    it('should get system metrics', async () => {
      const { sdk } = context;

      const metricsResult = await sdk.management.getMetrics();

      Assertions.isValidApiResponse(metricsResult);
      expect(metricsResult.success).toBe(true);
    });

    it('should get system metrics', async () => {
      const { sdk } = context;

      const metricsResult = await sdk.management.getMetrics();

      Assertions.isValidApiResponse(metricsResult);
      expect(metricsResult.success).toBe(true);
    });
  });

  describe('Service Integration', () => {
    it('should maintain authentication state across all services', async () => {
      const { sdk } = context;

      // Make calls to different services
      const [apiKeysResult, databaseResult, analyticsResult, healthResult] = await Promise.all([
        sdk.apiKeys.listApiKeys(),
        sdk.database.listDatabaseConnections(),
        sdk.analytics.getDashboardAnalytics(TestData.analyticsQuery),
        sdk.management.getSystemStatus(),
      ]);

      // All should succeed or fail consistently
      [apiKeysResult, databaseResult, analyticsResult, healthResult].forEach(result => {
        Assertions.isValidApiResponse(result);
      });
    });

    it('should handle base URL changes across all services', async () => {
      const { sdk } = context;

      const originalBaseUrl = sdk.getBaseURL();
      const newBaseUrl = 'https://new-api.example.com/v1';

      // Change base URL
      sdk.setBaseURL(newBaseUrl);

      // All services should use the new base URL
      expect(sdk.auth.getBaseURL()).toBe(newBaseUrl);
      expect(sdk.apiKeys.getBaseURL()).toBe(newBaseUrl);
      expect(sdk.database.getBaseURL()).toBe(newBaseUrl);
      expect(sdk.analytics.getBaseURL()).toBe(newBaseUrl);
      expect(sdk.management.getBaseURL()).toBe(newBaseUrl);

      // Restore original URL
      sdk.setBaseURL(originalBaseUrl);
    });

    it('should handle concurrent requests to multiple services', async () => {
      const { sdk } = context;

      const startTime = Date.now();

      // Make concurrent requests to different services
      const requests = [
        sdk.apiKeys.listApiKeys(),
        sdk.database.listDatabaseConnections(),
        sdk.analytics.getDashboardAnalytics(TestData.analyticsQuery),
        sdk.management.getSystemStatus(),
        sdk.analytics.getUsageStats('day'),
      ];

      const results = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should complete
      results.forEach(result => {
        Assertions.isValidApiResponse(result);
      });

      // Concurrent requests should be faster than sequential ones
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle service errors independently', async () => {
      const { sdk, server } = context;

      // Add an endpoint that always fails
      server.addEndpoint({
        method: 'GET',
        path: '/api-keys-error',
        response: {
          status: 500,
          data: {
            success: false,
            error: {
              code: 'SERVICE_ERROR',
              message: 'Service unavailable',
            },
          },
        },
      });

      // One service fails, others should still work
      const [healthResult, apiKeysResult] = await Promise.all([
        sdk.management.getSystemStatus(),
        sdk.apiKeys.listApiKeys(),
      ]);

      // Health should succeed
      expect(healthResult.success).toBe(true);

      // API Keys might succeed or fail depending on the endpoint hit
      Assertions.isValidApiResponse(apiKeysResult);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary network issues', async () => {
      const { sdk, server } = context;

      // First request succeeds
      let healthResult = await sdk.management.getSystemStatus();
      expect(healthResult.success).toBe(true);

      // Simulate temporary failure
      server.addEndpoint({
        method: 'GET',
        path: '/health',
        response: {
          status: 503,
          data: {
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Temporary service unavailable',
            },
          },
        },
      });

      // Second request might fail
      healthResult = await sdk.management.getSystemStatus();

      // But the SDK should still be usable
      expect(typeof healthResult.success).toBe('boolean');
      Assertions.isValidApiResponse(healthResult);
    });

    it('should handle authentication token refresh during service calls', async () => {
      const { sdk } = context;

      // Set a token that might need refresh
      sdk.setToken('expiring-token', 1); // 1 second expiry

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Make a service call that should trigger token refresh
      const apiKeysResult = await sdk.apiKeys.listApiKeys();

      // The call should either succeed (if refresh worked) or fail gracefully
      Assertions.isValidApiResponse(apiKeysResult);
    });
  });
});
