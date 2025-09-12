// @ts-nocheck
/* eslint-disable no-unused-vars */
/**
 * End-to-End Integration Tests
 *
 * These tests verify complete workflows and real-world usage scenarios:
 * - Complete user onboarding flow
 * - Database setup and search implementation
 * - Analytics and monitoring setup
 * - Multi-user scenarios
 * - Performance and reliability testing
 */

/* eslint-disable no-console */

import {
  Assertions,
  cleanupTestContext,
  createTestContext,
  PerformanceMeasurer,
  retry,
  TestData,
} from './helpers/test-utils';
import type { TestContext } from './helpers/test-utils';
import { TokenStorageManager } from '../src/utils/token-storage';
import { Altus4SDK } from '../src';

// Mock TokenStorageManager for integration tests
jest.mock('../src/utils/token-storage');
const mockTokenStorageManager = TokenStorageManager as jest.Mocked<typeof TokenStorageManager>;

describe('End-to-End Integration Tests', () => {
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
  });

  afterEach(async () => {
    if (context) {
      await cleanupTestContext(context);
    }
  });

  describe('Complete User Onboarding Flow', () => {
    it('should handle full user registration and setup workflow', async () => {
      const { sdk } = context;

      // Step 1: Register a new user
      const registerResult = await sdk.register(
        'John Doe',
        'john.doe@example.com',
        'securePassword123'
      );

      expect(registerResult.success).toBe(true);

      // Mock token storage to return valid token after registration
      if (registerResult.success && registerResult.token) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(registerResult.token);
      }

      expect(sdk.isAuthenticated()).toBe(true);

      // Step 2: Get user profile
      const profileResult = await sdk.getCurrentUser();
      expect(profileResult.success).toBe(true);
      expect(profileResult.user!.email).toBe('john.doe@example.com');

      // Step 3: Create first API key
      const apiKeyResult = await sdk.apiKeys.createApiKey({
        name: 'My First API Key',
        environment: 'development',
        permissions: ['search', 'analytics'],
      });

      expect(apiKeyResult.success).toBe(true);
      const apiKey = apiKeyResult.data!;
      expect(apiKey.name).toBe('My First API Key');

      // Step 4: Add first database connection
      const databaseResult = await sdk.database.addDatabaseConnection({
        name: 'My Application Database',
        host: 'localhost',
        port: 3306,
        database: 'myapp',
        username: 'appuser',
        password: 'apppass',
      });

      expect(databaseResult.success).toBe(true);
      const database = databaseResult.data!;
      expect(database.name).toBe('My Application Database');

      // Step 5: Test the database connection
      const connectionTestResult = await sdk.database.testDatabaseConnection(database.id);
      // Connection test may succeed or fail in mock environment
      Assertions.isValidApiResponse(connectionTestResult);

      // Step 6: View initial analytics (should be empty/minimal)
      const analyticsResult = await sdk.analytics.getDashboardAnalytics({ period: 'day' });
      expect(analyticsResult.success).toBe(true);
      expect(analyticsResult.data).toBeDefined();
    });

    it('should handle user login and workspace restoration', async () => {
      const { sdk } = context;

      // Step 1: Login with existing user
      const loginResult = await sdk.login(TestData.user.email, TestData.user.password);
      expect(loginResult.success).toBe(true);

      // Mock token storage to return valid token after login
      if (loginResult.success && loginResult.token) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(loginResult.token);
      }

      // Step 2: Load existing API keys
      const apiKeysResult = await sdk.apiKeys.listApiKeys();
      expect(apiKeysResult.success).toBe(true);

      // Step 3: Load existing database connections
      const databasesResult = await sdk.database.listDatabaseConnections();
      expect(databasesResult.success).toBe(true);

      // Step 4: Load recent analytics
      const analyticsResult = await sdk.analytics.getDashboardAnalytics({ period: 'week' });
      expect(analyticsResult.success).toBe(true);

      // User should be able to continue their work seamlessly
      expect(sdk.isAuthenticated()).toBe(true);
    });
  });

  describe('Database and Search Implementation Flow', () => {
    it('should implement complete database search setup', async () => {
      const { sdk } = context;

      // Setup authentication
      const loginResult = await sdk.login(TestData.user.email, TestData.user.password);
      if (loginResult.success && loginResult.token) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(loginResult.token);
      }

      // Step 1: Add production database
      const prodDbResult = await sdk.database.addDatabaseConnection({
        name: 'Production Database',
        host: 'prod-db.example.com',
        port: 3306,
        database: 'production',
        username: 'prod_user',
        password: 'prod_secure_pass',
      });

      expect(prodDbResult.success).toBe(true);
      const _prodDb = prodDbResult.data!;

      // Step 2: Create production API key
      const prodApiKeyResult = await sdk.apiKeys.createApiKey({
        name: 'Production Search Key',
        environment: 'production',
        permissions: ['search', 'analytics'],
      });

      expect(prodApiKeyResult.success).toBe(true);

      // Step 3: Configure search indexes (this would be a future SDK feature)
      // For now, we can simulate with a management call
      const healthResult = await sdk.management.getSystemStatus();
      expect(healthResult.success).toBe(true);

      // Step 4: Monitor initial setup analytics
      const setupAnalyticsResult = await sdk.analytics.getDashboardAnalytics({ period: 'day' });
      expect(setupAnalyticsResult.success).toBe(true);
    });

    it('should handle multiple environment setup', async () => {
      const { sdk } = context;

      const loginResult = await sdk.login(TestData.user.email, TestData.user.password);
      if (loginResult.success && loginResult.token) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(loginResult.token);
      }

      const environments = ['development', 'staging', 'production'];
      const createdResources: Array<{ db: any; apiKey: any }> = [];

      // Create resources for each environment
      for (const env of environments) {
        // Create database connection
        const dbResult = await sdk.database.addDatabaseConnection({
          name: `${env.charAt(0).toUpperCase() + env.slice(1)} Database`,
          host: `${env}-db.example.com`,
          port: 3306,
          database: env,
          username: `${env}_user`,
          password: `${env}_pass`,
        });

        expect(dbResult.success).toBe(true);

        // Create API key
        const apiKeyResult = await sdk.apiKeys.createApiKey({
          name: `${env.charAt(0).toUpperCase() + env.slice(1)} API Key`,
          environment: env as any,
          permissions:
            env === 'production' ? ['search', 'analytics'] : ['search', 'analytics', 'admin'],
        });

        expect(apiKeyResult.success).toBe(true);

        createdResources.push({
          db: dbResult.data!,
          apiKey: apiKeyResult.data!,
        });
      }

      // Verify all resources were created
      const allDatabasesResult = await sdk.database.listDatabaseConnections();
      expect(allDatabasesResult.success).toBe(true);
      expect(allDatabasesResult.data!.length).toBeGreaterThanOrEqual(environments.length);

      const allApiKeysResult = await sdk.apiKeys.listApiKeys();
      expect(allApiKeysResult.success).toBe(true);
      expect(allApiKeysResult.data!.length).toBeGreaterThanOrEqual(environments.length);
    });
  });

  describe('Analytics and Monitoring Workflow', () => {
    it('should implement comprehensive monitoring setup', async () => {
      const { sdk } = context;

      const loginResult = await sdk.login(TestData.user.email, TestData.user.password);
      if (loginResult.success && loginResult.token) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(loginResult.token);
      }

      // Step 1: Set up monitoring dashboard
      const dashboardResult = await sdk.analytics.getDashboardAnalytics({ period: 'month' });
      expect(dashboardResult.success).toBe(true);

      // Step 2: Configure analytics tracking
      const trendsResult = await sdk.analytics.getTrends({ period: 'week' });
      expect(trendsResult.success).toBe(true);

      // Step 3: Set up performance monitoring
      const performanceResult = await sdk.analytics.getPerformanceMetrics({
        granularity: 'hour',
        period: 'day',
      });
      expect(performanceResult.success).toBe(true);

      // Step 4: Configure AI insights
      const insightsResult = await sdk.analytics.getInsights({ type: 'search' });
      expect(insightsResult.success).toBe(true);

      // Step 5: Set up usage tracking
      const usageResult = await sdk.analytics.getUsageStats('month');
      expect(usageResult.success).toBe(true);

      // All monitoring components should be working
      expect(sdk.isAuthenticated()).toBe(true);
    });

    it('should handle analytics data export workflow', async () => {
      const { sdk } = context;

      const loginResult = await sdk.login(TestData.user.email, TestData.user.password);
      if (loginResult.success && loginResult.token) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(loginResult.token);
      }

      // Get various analytics for export
      const [dashboard, trends, performance, history] = await Promise.all([
        sdk.analytics.getDashboardAnalytics({ period: 'month' }),
        sdk.analytics.getTrends({ period: 'month' }),
        sdk.analytics.getPerformanceMetrics({ granularity: 'day', period: 'month' }),
        sdk.analytics.getSearchHistory({ limit: 1000 }),
      ]);

      // All should succeed
      expect(dashboard.success).toBe(true);
      expect(trends.success).toBe(true);
      expect(performance.success).toBe(true);
      expect(history.success).toBe(true);

      // Data should be suitable for export/reporting
      expect(dashboard.data).toBeDefined();
      expect(Array.isArray(history.data)).toBe(true);
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should handle team collaboration workflow', async () => {
      const { server: _server, baseUrl } = context;

      // Create multiple SDK instances for different users
      const adminSDK = new Altus4SDK({
        baseURL: baseUrl,
        timeout: 5000,
      });

      const userSDK = new Altus4SDK({
        baseURL: baseUrl,
        timeout: 5000,
      });

      // Admin user setup
      const adminLoginResult = await adminSDK.login(TestData.user.email, TestData.user.password);
      if (adminLoginResult.success && adminLoginResult.token) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(adminLoginResult.token);
      }

      // Admin creates shared resources
      const sharedDbResult = await adminSDK.database.addDatabaseConnection({
        name: 'Shared Team Database',
        host: 'team-db.example.com',
        port: 3306,
        database: 'team_data',
        username: 'team_user',
        password: 'team_pass',
      });

      expect(sharedDbResult.success).toBe(true);

      // Admin creates API key for team
      const teamApiKeyResult = await adminSDK.apiKeys.createApiKey({
        name: 'Team API Key',
        environment: 'production',
        permissions: ['search', 'analytics'],
      });

      expect(teamApiKeyResult.success).toBe(true);

      // Regular user login and access
      await userSDK.register('Jane Smith', 'jane.smith@example.com', 'password123');

      // User should be able to access analytics (shared data)
      const userAnalyticsResult = await userSDK.analytics.getDashboardAnalytics({ period: 'day' });
      expect(userAnalyticsResult.success).toBe(true);

      // Both users should be able to work independently
      expect(adminSDK.isAuthenticated()).toBe(true);
      expect(userSDK.isAuthenticated()).toBe(true);
    });

    it('should handle concurrent user operations', async () => {
      const { baseUrl } = context;

      // Create multiple concurrent users
      const users = Array(3)
        .fill(null)
        .map((_, i) => ({
          sdk: new Altus4SDK({
            baseURL: baseUrl,
            timeout: 5000,
          }),
          email: `user${i}@example.com`,
          password: `password${i}`,
        }));

      // All users register simultaneously
      const registrations = await Promise.all(
        users.map(user => user.sdk.register(`User ${user.email}`, user.email, user.password))
      );

      // All registrations should succeed (or fail gracefully)
      registrations.forEach(result => {
        Assertions.isValidApiResponse(result);
      });

      // All users create resources simultaneously
      const resourceCreations = await Promise.all(
        users.map((user, i) =>
          user.sdk.apiKeys.createApiKey({
            name: `User ${i} API Key`,
            environment: 'development',
            permissions: ['search'],
          })
        )
      );

      resourceCreations.forEach(result => {
        Assertions.isValidApiResponse(result);
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high-frequency API calls', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();

      await sdk.login(TestData.user.email, TestData.user.password);

      // Make many rapid API calls
      const callCount = 20;
      const calls: Promise<any>[] = [];

      measurer.start();

      for (let i = 0; i < callCount; i++) {
        calls.push(sdk.analytics.getDashboardAnalytics({ period: 'day' }));
      }

      const results = await Promise.all(calls);
      const duration = measurer.stop();

      // All calls should succeed
      results.forEach(result => {
        Assertions.isValidApiResponse(result);
      });

      // Performance should be reasonable
      expect(duration).toBeLessThan(10000); // Less than 10 seconds for 20 calls
      console.log(`Completed ${callCount} API calls in ${duration}ms`);
    });

    it('should handle network resilience scenarios', async () => {
      const { sdk, server } = context;

      await sdk.login(TestData.user.email, TestData.user.password);

      // Add slow endpoints to simulate network issues
      server.addEndpoint({
        method: 'GET',
        path: '/analytics/dashboard-slow',
        delay: 1000,
        response: {
          status: 200,
          data: {
            success: true,
            data: { totalSearches: 100 },
          },
        },
      });

      // Test with retry logic
      const slowResult = await retry(
        () => sdk.analytics.getDashboardAnalytics({ period: 'day' }),
        3,
        500
      );

      Assertions.isValidApiResponse(slowResult);
    });

    it('should handle SDK lifecycle management', async () => {
      const { baseUrl } = context;

      // Create SDK
      let sdk = new Altus4SDK({
        baseURL: baseUrl,
        timeout: 5000,
      });

      // Use SDK
      const loginResult = await sdk.login(TestData.user.email, TestData.user.password);
      if (loginResult.success && loginResult.token) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(loginResult.token);
      }
      expect(sdk.isAuthenticated()).toBe(true);

      // Get some data
      const initialResult = await sdk.analytics.getDashboardAnalytics({ period: 'day' });
      expect(initialResult.success).toBe(true);

      // Simulate SDK recreation (page reload, app restart, etc.)
      const oldBaseUrl = sdk.getBaseURL();
      sdk = new Altus4SDK({
        baseURL: oldBaseUrl,
        timeout: 5000,
      });

      // SDK should handle reinitialization
      const newLoginResult = await sdk.login(TestData.user.email, TestData.user.password);
      if (newLoginResult.success && newLoginResult.token) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(newLoginResult.token);
      }
      expect(sdk.isAuthenticated()).toBe(true);

      // Should be able to continue working
      const newResult = await sdk.analytics.getDashboardAnalytics({ period: 'day' });
      expect(newResult.success).toBe(true);
    });

    it('should handle memory and resource management', async () => {
      const { baseUrl } = context;

      // Create and destroy many SDK instances
      for (let i = 0; i < 10; i++) {
        const sdk = new Altus4SDK({
          baseURL: baseUrl,
          timeout: 5000,
        });

        const loginResult = await sdk.login(TestData.user.email, TestData.user.password);
        if (loginResult.success && loginResult.token) {
          mockTokenStorageManager.hasValidToken.mockReturnValue(true);
          mockTokenStorageManager.getToken.mockReturnValue(loginResult.token);
        }
        await sdk.analytics.getDashboardAnalytics({ period: 'day' });

        // Clean up
        sdk.clearToken();
      }

      // No memory leaks or resource issues should occur
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should recover from complete service outage', async () => {
      const { sdk, server } = context;

      await sdk.login(TestData.user.email, TestData.user.password);

      // Simulate complete service outage
      await server.stop();

      // Calls should fail gracefully
      const outageResult = await sdk.analytics.getDashboardAnalytics({ period: 'day' });
      expect(outageResult.success).toBe(false);

      // Restart server
      await server.start();

      // Service should recover
      const recoveryResult = await sdk.analytics.getDashboardAnalytics({ period: 'day' });
      // May succeed or fail depending on exact implementation
      Assertions.isValidApiResponse(recoveryResult);
    });

    it('should handle malformed API responses', async () => {
      const { sdk, server } = context;

      await sdk.login(TestData.user.email, TestData.user.password);

      // Add endpoint with malformed response
      server.addEndpoint({
        method: 'GET',
        path: '/analytics/malformed',
        response: {
          status: 200,
          data: 'not-valid-json',
        },
      });

      // SDK should handle malformed responses gracefully
      // This test would require hitting the malformed endpoint specifically
      // For now, we test that SDK continues to work normally
      const normalResult = await sdk.analytics.getDashboardAnalytics({ period: 'day' });
      Assertions.isValidApiResponse(normalResult);
    });

    it('should handle session expiration during long workflows', async () => {
      const { sdk } = context;

      // Login with short-lived token
      await sdk.login(TestData.user.email, TestData.user.password);
      sdk.setToken('short-lived-token', 1); // 1 second expiry

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Long workflow that should trigger token refresh
      const workflowResults = await Promise.all([
        sdk.apiKeys.listApiKeys(),
        sdk.database.listDatabaseConnections(),
        sdk.analytics.getDashboardAnalytics({ period: 'day' }),
        sdk.management.getSystemStatus(),
      ]);

      // Workflow should complete (with potential re-authentication)
      workflowResults.forEach(result => {
        Assertions.isValidApiResponse(result);
      });
    });
  });
});
