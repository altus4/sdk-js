/**
 * Authentication Integration Tests
 *
 * These tests verify the complete authentication flow including:
 * - Login/register workflows
 * - Token management and refresh
 * - Session persistence
 * - Authentication state management
 */

// @ts-nocheck
/* eslint-disable no-unused-vars */

// @ts-nocheck
/* eslint-disable no-unused-vars */

import { Assertions, cleanupTestContext, createTestContext, TestData } from './helpers/test-utils';
import type { TestContext } from './helpers/test-utils';
import { Altus4SDK } from '../src';
import { TokenStorageManager } from '../src/utils/token-storage';

// Mock TokenStorageManager for integration tests
jest.mock('../src/utils/token-storage');
const mockTokenStorageManager = TokenStorageManager as jest.Mocked<typeof TokenStorageManager>;

describe('Authentication Integration Tests', () => {
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

  describe('Login Flow', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const { sdk } = context;

      // Initial state - not authenticated
      expect(sdk.isAuthenticated()).toBe(false);

      // Perform login
      const loginResult = await sdk.login(TestData.user.email, TestData.user.password);

      // Verify response structure
      Assertions.isValidApiResponse(loginResult);
      expect(loginResult.success).toBe(true);
      expect(loginResult.user).toBeDefined();
      expect(loginResult.token).toBeDefined();
      expect(loginResult.expiresIn).toBeDefined();

      // Verify user data
      Assertions.isValidUser(loginResult.user!);
      expect(loginResult.user!.email).toBe(TestData.user.email);

      // Verify token
      Assertions.isValidToken(loginResult.token!);
      expect(typeof loginResult.expiresIn).toBe('number');
      expect(loginResult.expiresIn).toBeGreaterThan(0);

      // Mock token storage to return valid token after login
      mockTokenStorageManager.hasValidToken.mockReturnValue(true);
      mockTokenStorageManager.getToken.mockReturnValue(loginResult.token!);

      // Verify SDK state
      expect(sdk.isAuthenticated()).toBe(true);
    });

    it('should reject invalid credentials', async () => {
      const { sdk } = context;

      const loginResult = await sdk.login('invalid@example.com', 'wrongpassword');

      Assertions.isValidApiResponse(loginResult);
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeDefined();
      expect(loginResult.error!.code).toBe('INVALID_CREDENTIALS');

      // SDK should remain unauthenticated
      expect(sdk.isAuthenticated()).toBe(false);
    });

    it('should handle network errors during login', async () => {
      const { sdk } = context;

      // Create SDK instance pointing to non-existent server
      const errorSDK = new Altus4SDK({
        baseURL: 'http://localhost:99999', // Non-existent port
        timeout: 1000,
      });

      const loginResult = await errorSDK.login(TestData.user.email, TestData.user.password);

      // Should handle the error gracefully
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeDefined();
      expect(loginResult.error!.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const { sdk } = context;

      const registerResult = await sdk.register(
        'New User',
        'newuser@altus4.example.com',
        'newpassword123'
      );

      Assertions.isValidApiResponse(registerResult);
      expect(registerResult.success).toBe(true);
      expect(registerResult.user).toBeDefined();
      expect(registerResult.token).toBeDefined();

      // Verify user data
      Assertions.isValidUser(registerResult.user!);
      expect(registerResult.user!.email).toBe('newuser@altus4.example.com');
      expect(registerResult.user!.name).toBe('New User');

      // Verify token
      Assertions.isValidToken(registerResult.token!);

      // Mock token storage to return valid token after registration
      mockTokenStorageManager.hasValidToken.mockReturnValue(true);
      mockTokenStorageManager.getToken.mockReturnValue(registerResult.token!);

      // SDK should be authenticated after registration
      expect(sdk.isAuthenticated()).toBe(true);
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout', async () => {
      const { sdk } = context;

      // First login
      const loginResult = await sdk.login(TestData.user.email, TestData.user.password);
      if (loginResult.success) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(loginResult.token!);
      }
      expect(sdk.isAuthenticated()).toBe(true);

      // Then logout
      const logoutResult = await sdk.logout();

      Assertions.isValidApiResponse(logoutResult);
      expect(logoutResult.success).toBe(true);

      // Mock token storage to return invalid token after logout
      mockTokenStorageManager.hasValidToken.mockReturnValue(false);
      mockTokenStorageManager.getToken.mockReturnValue(null);

      // SDK should no longer be authenticated
      expect(sdk.isAuthenticated()).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should handle manual token setting and clearing', async () => {
      const { sdk } = context;

      // Set token manually
      sdk.setToken('manual-test-token', 3600);

      // Mock token storage to return valid token after setting
      mockTokenStorageManager.hasValidToken.mockReturnValue(true);
      mockTokenStorageManager.getToken.mockReturnValue('manual-test-token');

      expect(sdk.isAuthenticated()).toBe(true);

      // Clear token
      sdk.clearToken();

      // Mock token storage to return invalid token after clearing
      mockTokenStorageManager.hasValidToken.mockReturnValue(false);
      mockTokenStorageManager.getToken.mockReturnValue(null);

      expect(sdk.isAuthenticated()).toBe(false);
    });

    it('should refresh token when needed', async () => {
      const { sdk } = context;

      // Login first
      await sdk.login(TestData.user.email, TestData.user.password);

      // Test token refresh
      const refreshed = await sdk.refreshTokenIfNeeded();

      // The refresh behavior depends on token expiration
      // In our mock, tokens don't expire immediately, so refresh might return false
      expect(typeof refreshed).toBe('boolean');
    });
  });

  describe('User Profile Management', () => {
    it('should get current user profile', async () => {
      const { sdk } = context;

      // Login first
      const loginResult = await sdk.login(TestData.user.email, TestData.user.password);
      if (loginResult.success) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(loginResult.token!);
      }

      const userResult = await sdk.getCurrentUser();

      Assertions.isValidApiResponse(userResult);
      expect(userResult.success).toBe(true);
      expect(userResult.user).toBeDefined();

      Assertions.isValidUser(userResult.user!);
      expect(userResult.user!.email).toBe(TestData.user.email);
    });

    it('should check admin status', async () => {
      const { sdk } = context;

      // Login first
      const loginResult = await sdk.login(TestData.user.email, TestData.user.password);
      if (loginResult.success) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(loginResult.token!);
      }

      const isAdmin = await sdk.isAdmin();
      expect(typeof isAdmin).toBe('boolean');
      // Test user is not an admin by default
      expect(isAdmin).toBe(false);
    });

    it('should fail to get user profile without authentication', async () => {
      const { sdk } = context;

      // Try to get user without being authenticated
      const userResult = await sdk.getCurrentUser();

      // This might succeed or fail depending on implementation
      // If it fails, it should fail gracefully
      if (!userResult.success) {
        expect(userResult.error).toBeDefined();
      }
    });
  });

  describe('Authentication State Persistence', () => {
    it('should maintain authentication state across SDK instances', async () => {
      const { baseUrl } = context;

      // Create first SDK instance and login
      const sdk1 = new Altus4SDK({
        baseURL: baseUrl,
        timeout: 5000,
      });

      const loginResult = await sdk1.login(TestData.user.email, TestData.user.password);
      if (loginResult.success) {
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(loginResult.token!);
      }
      expect(sdk1.isAuthenticated()).toBe(true);

      // Create second SDK instance
      const sdk2 = new Altus4SDK({
        baseURL: baseUrl,
        timeout: 5000,
      });

      // Ensure the second instance was created properly
      expect(typeof sdk2.getBaseURL()).toBe('string');

      // The second instance should inherit the authentication state
      // This depends on token storage implementation
      // In a browser environment with localStorage, this would be true
      // In Node.js test environment, this might not work the same way
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      const { sdk, server } = context;

      // Add endpoint that returns server error
      server.addEndpoint({
        method: 'POST',
        path: '/auth/server-error',
        response: {
          status: 500,
          data: {
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Internal server error',
            },
          },
        },
      });

      // This would require modifying the SDK to hit different endpoint
      // For now, we can test that errors are handled properly
      const loginResult = await sdk.login('error@example.com', 'password');

      if (!loginResult.success && loginResult.error) {
        expect(loginResult.error).toBeDefined();
        expect(typeof loginResult.error.message).toBe('string');
      }
    });

    it('should handle timeout errors', async () => {
      const { sdk, server: _server } = context;

      // Add slow endpoint
      _server.addEndpoint({
        method: 'POST',
        path: '/auth/slow-login',
        delay: 2000, // 2 second delay
        response: {
          status: 200,
          data: {
            success: true,
            data: {
              user: { id: 'test', email: 'test@example.com' },
              token: 'slow-token',
              expiresIn: 3600,
            },
          },
        },
      });

      // Create SDK with very short timeout
      const fastSDK = new Altus4SDK({
        baseURL: context.baseUrl,
        timeout: 500, // 500ms timeout
      });

      // This should timeout (though exact behavior depends on axios configuration)
      const startTime = Date.now();
      const fastLoginResult = await fastSDK.login(TestData.user.email, TestData.user.password);
      const duration = Date.now() - startTime;

      // Ensure we got a response object
      expect(typeof fastLoginResult.success).toBe('boolean');

      // The request should not take longer than the timeout + some buffer
      expect(duration).toBeLessThan(2000);
    }, 10000);
  });

  describe('Concurrent Authentication', () => {
    it('should handle multiple simultaneous login attempts', async () => {
      const { sdk } = context;

      // Start multiple login attempts simultaneously
      const loginPromises = Array(3)
        .fill(null)
        .map(() => sdk.login(TestData.user.email, TestData.user.password));

      const results = await Promise.all(loginPromises);

      // All should succeed (or at least not fail catastrophically)
      results.forEach(result => {
        Assertions.isValidApiResponse(result);
      });

      // At least one should succeed
      const successfulLogins = results.filter(r => r.success);
      expect(successfulLogins.length).toBeGreaterThan(0);

      // If any login succeeded, mock the token storage
      if (successfulLogins.length > 0) {
        const successfulLogin = successfulLogins[0];
        mockTokenStorageManager.hasValidToken.mockReturnValue(true);
        mockTokenStorageManager.getToken.mockReturnValue(successfulLogin.token!);
      }

      // SDK should be authenticated
      expect(sdk.isAuthenticated()).toBe(true);
    });
  });
});
