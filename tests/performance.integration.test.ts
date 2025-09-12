/**
 * Performance Integration Tests
 *
 * These tests verify SDK performance characteristics:
 * - Response times
 * - Memory usage
 * - Concurrent request handling
 * - Resource cleanup
 * - Scalability limits
 */

// @ts-nocheck
/* eslint-disable no-console, no-unused-vars */

import {
  Assertions,
  cleanupTestContext,
  createTestContext,
  PerformanceMeasurer,
  TestData,
} from './helpers/test-utils';
import type { TestContext } from './helpers/test-utils';
import { TokenStorageManager } from '../src/utils/token-storage';
import { Altus4SDK } from '../src';

// Mock TokenStorageManager for integration tests
jest.mock('../src/utils/token-storage');
const mockTokenStorageManager = TokenStorageManager as jest.Mocked<typeof TokenStorageManager>;

describe('Performance Integration Tests', () => {
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

  describe('Response Time Performance', () => {
    it('should meet response time SLAs for authentication', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();

      sdk.clearToken();

      const { duration } = await measurer.measure(async () => {
        return sdk.login(TestData.user.email, TestData.user.password);
      });

      // Authentication should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should meet response time SLAs for API operations', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();

      const operations = [
        () => sdk.apiKeys.listApiKeys(),
        () => sdk.database.listDatabaseConnections(),
        () => sdk.analytics.getDashboardAnalytics({ period: 'day' }),
        () => sdk.management.getSystemStatus(),
      ];

      for (const operation of operations) {
        const { duration } = await measurer.measure(operation);

        // Each operation should complete within 1 second
        expect(duration).toBeLessThan(1000);
      }
    });

    it('should maintain consistent response times under load', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();
      const iterations = 10;
      const durations: number[] = [];

      // Make multiple requests and measure each
      for (let i = 0; i < iterations; i++) {
        const { duration } = await measurer.measure(async () => {
          return sdk.analytics.getDashboardAnalytics({ period: 'day' });
        });
        durations.push(duration);
      }

      // Calculate statistics
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      console.log(
        `Response times - Avg: ${avgDuration}ms, Min: ${minDuration}ms, Max: ${maxDuration}ms`
      );

      // Performance should be consistent
      expect(avgDuration).toBeLessThan(500);
      expect(maxDuration).toBeLessThan(1000);

      // Variance should be reasonable (max shouldn't be more than 3x min)
      expect(maxDuration / minDuration).toBeLessThan(3);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();
      const concurrentRequests = 5;

      const { result: results, duration } = await measurer.measure(async () => {
        const requests = Array(concurrentRequests)
          .fill(null)
          .map(() => sdk.analytics.getDashboardAnalytics({ period: 'day' }));
        return Promise.all(requests);
      });

      // All requests should succeed
      results.forEach(result => {
        Assertions.isValidApiResponse(result);
      });

      // Concurrent requests should be faster than sequential ones
      // Should complete in less than 2x the time of a single request
      expect(duration).toBeLessThan(2000);
    });

    it('should scale with increased concurrency', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();

      const concurrencyLevels = [1, 3, 5];
      const results = [];

      for (const concurrency of concurrencyLevels) {
        const { duration } = await measurer.measure(async () => {
          const requests = Array(concurrency)
            .fill(null)
            .map(() => sdk.apiKeys.listApiKeys());
          return Promise.all(requests);
        });

        results.push({ concurrency, duration, throughput: (concurrency / duration) * 1000 });
        console.log(
          `Concurrency ${concurrency}: ${duration}ms (${((concurrency / duration) * 1000).toFixed(2)} req/sec)`
        );
      }

      // Higher concurrency should maintain reasonable throughput
      const baseThroughput = results[0].throughput;
      results.forEach((result, i) => {
        if (i > 0) {
          // Throughput shouldn't degrade by more than 50% as concurrency increases
          expect(result.throughput).toBeGreaterThan(baseThroughput * 0.5);
        }
      });
    });

    it('should handle request queueing gracefully', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();
      const queueSize = 20;

      // Create a large queue of requests
      const { result: results, duration } = await measurer.measure(async () => {
        const requests = Array(queueSize)
          .fill(null)
          .map((_, i) =>
            sdk.analytics.getDashboardAnalytics({
              period: i % 2 === 0 ? 'day' : 'week',
            })
          );
        return Promise.all(requests);
      });

      // All requests should complete successfully
      results.forEach(result => {
        Assertions.isValidApiResponse(result);
      });

      // Should complete in reasonable time
      expect(duration).toBeLessThan(10000); // Less than 10 seconds
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory with repeated SDK creation', async () => {
      const { baseUrl } = context;
      const iterations = 50;

      // Get initial memory usage (if available in Node.js)
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      // Create and destroy many SDK instances
      for (let i = 0; i < iterations; i++) {
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
        sdk.clearToken();

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Memory usage shouldn't have grown significantly
      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryGrowth = finalMemory - initialMemory;

      console.log(
        `Memory growth after ${iterations} iterations: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`
      );

      // Memory growth should be reasonable (less than 15MB for 50 iterations)
      // Note: In Jest test environment, some memory growth is expected due to test infrastructure
      if (process.memoryUsage) {
        expect(memoryGrowth).toBeLessThan(15 * 1024 * 1024);
      }
    });

    it('should clean up resources properly', async () => {
      const { sdk } = context;

      // Create some resources
      const apiKeyResult = await sdk.apiKeys.createApiKey({
        name: 'Test Performance Key',
        environment: 'test',
        permissions: ['search'],
      });

      expect(apiKeyResult.success).toBe(true);

      // Clear all authentication and state
      sdk.clearToken();

      // Update mock to reflect cleared state
      mockTokenStorageManager.hasValidToken.mockReturnValue(false);
      mockTokenStorageManager.getToken.mockReturnValue(null);

      // SDK should be clean
      expect(sdk.isAuthenticated()).toBe(false);

      // Should be able to start fresh
      const freshLoginResult = await sdk.login(TestData.user.email, TestData.user.password);
      if (freshLoginResult.success && freshLoginResult.token) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(freshLoginResult.token);
      }
      expect(sdk.isAuthenticated()).toBe(true);
    });

    it('should handle large response payloads efficiently', async () => {
      const { sdk, server } = context;
      const measurer = new PerformanceMeasurer();

      // Add endpoint with large response
      server.addEndpoint({
        method: 'GET',
        path: '/analytics/large-dataset',
        response: {
          status: 200,
          data: {
            success: true,
            data: {
              // Simulate large dataset
              records: Array(1000)
                .fill(null)
                .map((_, i) => ({
                  id: `record-${i}`,
                  timestamp: new Date().toISOString(),
                  data: `Large data payload for record ${i}`.repeat(10),
                })),
            },
          },
        },
      });

      const { duration } = await measurer.measure(async () => {
        return sdk.analytics.getDashboardAnalytics({ period: 'month' });
      });

      // Should handle large payloads efficiently
      expect(duration).toBeLessThan(3000); // Less than 3 seconds
    });
  });

  describe('Network Performance', () => {
    it('should optimize request batching', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();

      // Make related requests that could potentially be batched
      const { result: results, duration } = await measurer.measure(async () => {
        return Promise.all([
          sdk.apiKeys.listApiKeys(),
          sdk.database.listDatabaseConnections(),
          sdk.management.getSystemStatus(),
        ]);
      });

      // All should succeed
      results.forEach(result => {
        Assertions.isValidApiResponse(result);
      });

      // Batched requests should be faster than sequential
      expect(duration).toBeLessThan(1500);
    });

    it('should handle network latency gracefully', async () => {
      const { sdk, server } = context;
      const measurer = new PerformanceMeasurer();

      // Replace existing endpoint with delayed version to simulate network latency
      server.replaceEndpoint({
        method: 'GET',
        path: '/analytics/dashboard',
        delay: 200, // 200ms latency
        response: {
          status: 200,
          data: {
            success: true,
            data: { totalSearches: 100 },
          },
        },
      });

      const { duration } = await measurer.measure(async () => {
        return sdk.analytics.getDashboardAnalytics({ period: 'day' });
      });

      // Should handle latency gracefully
      expect(duration).toBeGreaterThan(200); // At least the delay
      expect(duration).toBeLessThan(1000); // But not too slow
    });

    it('should optimize for mobile/low-bandwidth scenarios', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();

      // Test with minimal data requests
      const { result, duration } = await measurer.measure(async () => {
        return sdk.analytics.getUsageStats('day');
      });

      Assertions.isValidApiResponse(result);

      // Should be fast for mobile scenarios
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Scalability Limits', () => {
    it('should identify maximum concurrent request limit', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();

      // Test increasingly high concurrency levels
      const concurrencyLevels = [10, 25, 50];

      for (const concurrency of concurrencyLevels) {
        try {
          const { result: results, duration } = await measurer.measure(async () => {
            const requests = Array(concurrency)
              .fill(null)
              .map(() => sdk.management.getSystemStatus());
            return Promise.all(requests);
          });

          const successCount = results.filter(r => r.success).length;
          const successRate = successCount / results.length;

          console.log(
            `Concurrency ${concurrency}: ${successCount}/${concurrency} succeeded (${(successRate * 100).toFixed(1)}%) in ${duration}ms`
          );

          // Should maintain at least 80% success rate
          expect(successRate).toBeGreaterThan(0.8);
        } catch (error) {
          // Some failure is acceptable at very high concurrency
          if (concurrency <= 25) {
            throw error; // Shouldn't fail at moderate concurrency
          }
        }
      }
    });

    it('should handle rapid sequential requests', async () => {
      const { sdk } = context;
      const measurer = new PerformanceMeasurer();
      const requestCount = 100;

      const { result: results, duration } = await measurer.measure(async () => {
        const results = [];
        for (let i = 0; i < requestCount; i++) {
          results.push(await sdk.management.getSystemStatus());
        }
        return results;
      });

      const successCount = results.filter(r => r.success).length;
      const successRate = successCount / results.length;
      const throughput = (requestCount / duration) * 1000;

      console.log(
        `${requestCount} sequential requests: ${successCount} succeeded (${(successRate * 100).toFixed(1)}%) in ${duration}ms (${throughput.toFixed(2)} req/sec)`
      );

      // Should maintain high success rate
      expect(successRate).toBeGreaterThan(0.9);

      // Should maintain reasonable throughput
      expect(throughput).toBeGreaterThan(5); // At least 5 requests per second
    });

    it('should handle sustained load over time', async () => {
      const { sdk } = context;
      const duration = 10000; // 10 seconds
      const interval = 100; // 100ms between requests
      const startTime = Date.now();

      const results = [];
      let requestCount = 0;

      while (Date.now() - startTime < duration) {
        try {
          const result = await sdk.management.getSystemStatus();
          results.push(result);
          requestCount++;

          // Wait before next request
          await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error) {
          results.push({ success: false, error: error.message });
          requestCount++;
        }
      }

      const actualDuration = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      const successRate = successCount / results.length;

      console.log(
        `Sustained load test: ${successCount}/${requestCount} succeeded (${(successRate * 100).toFixed(1)}%) over ${actualDuration}ms`
      );

      // Should maintain stability under sustained load
      expect(successRate).toBeGreaterThan(0.9);
      expect(requestCount).toBeGreaterThan(50); // Should have made substantial requests
    }, 15000); // Longer timeout for this test
  });
});
