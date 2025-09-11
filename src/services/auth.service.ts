/**
 * Authentication Service
 */

import { BaseClient } from '../client/base-client';
import type { ClientConfig } from '../client/config';
import type {
  AuthResult,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
} from '../types/auth';
import { TokenStorageManager } from '../utils/token-storage';

export class AuthService extends BaseClient {
  private currentUser: User | null = null;

  constructor(config: ClientConfig = {}) {
    super(config);
    // With cookie-based refresh flow, token is kept in memory and refresh is handled by server-side cookie
    this.initializeFromStorage();
  }

  /**
   * Initialize auth state from storage
   */
  private initializeFromStorage(): void {
    const tokenData = TokenStorageManager.getTokenData();
    if (tokenData) {
      // Don't automatically fetch user here to avoid API calls during construction
      // Token is automatically available through TokenStorageManager
    }
  }

  // persistence responsibilities moved to server-side refresh cookie

  /**
   * Handle user login
   */
  async handleLogin(credentials: LoginRequest): Promise<AuthResult> {
    const response = await this.request<{ user: User; token: string; expiresIn: number }>(
      '/auth/login',
      {
        method: 'POST',
        data: credentials,
        withCredentials: true,
      }
    );

    if (response.success && response.data) {
      this.setToken(response.data.token, response.data.expiresIn);
      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
        expiresIn: response.data.expiresIn,
      };
    }

    return {
      success: false,
      error: response.error,
    };
  }

  /**
   * Handle user registration
   */
  async handleRegister(userData: RegisterRequest): Promise<AuthResult> {
    const response = await this.request<{ user: User; token: string; expiresIn: number }>(
      '/auth/register',
      {
        method: 'POST',
        data: userData,
        withCredentials: true,
      }
    );

    if (response.success && response.data) {
      this.setToken(response.data.token, response.data.expiresIn);
      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
        expiresIn: response.data.expiresIn,
      };
    }

    return {
      success: false,
      error: response.error,
    };
  }

  /**
   * Handle user logout
   */
  async handleLogout(): Promise<{ success: boolean; error?: any }> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
      withCredentials: true,
    });

    if (response.success) {
      this.clearToken();
    }

    return response;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<{ success: boolean; user?: User; error?: any }> {
    const response = await this.request<User>('/auth/profile');

    if (response.success && response.data) {
      return {
        success: true,
        user: response.data,
      };
    }

    return {
      success: false,
      error: response.error,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    updates: UpdateProfileRequest
  ): Promise<{ success: boolean; user?: User; error?: any }> {
    const response = await this.request<User>('/auth/profile', {
      method: 'PUT',
      data: updates,
    });

    if (response.success && response.data) {
      return {
        success: true,
        user: response.data,
      };
    }

    return {
      success: false,
      error: response.error,
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return TokenStorageManager.hasValidToken();
  }

  /**
   * Check if user is admin
   */
  async isAdmin(): Promise<boolean> {
    const userResponse = await this.getCurrentUser();
    return userResponse.success && userResponse.user?.role === 'admin';
  }

  /**
   * Set authentication token
   */
  override setToken(token: string, expiresIn?: number): void {
    // store access token in-memory via BaseClient and enhanced storage
    super.setToken(token, expiresIn);
  }

  /**
   * Clear authentication token
   */
  override clearToken(): void {
    this.token = null;
    this.currentUser = null;
    super.clearToken();
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (!TokenStorageManager.hasValidToken()) {
      return false;
    }

    if (TokenStorageManager.isTokenExpiringSoon()) {
      try {
        const response = await this.request<{ token: string; expiresIn: number }>('/auth/refresh', {
          method: 'POST',
          withCredentials: true,
        });

        if (response.success && response.data) {
          this.setToken(response.data.token, response.data.expiresIn);
          return true;
        }
      } catch (error) {
        // Token refresh failed silently
      }
    }

    return false;
  }

  /**
   * Attempt to restore session by calling the refresh endpoint which uses an HttpOnly refresh cookie.
   * Returns true if a new access token was obtained and set in memory.
   */
  async restoreSession(): Promise<boolean> {
    try {
      const response = await this.request<{ token: string; expiresIn: number }>('/auth/refresh', {
        method: 'POST',
        withCredentials: true,
      });

      if (response.success && response.data) {
        this.setToken(response.data.token, response.data.expiresIn);
        return true;
      }
    } catch (e) {
      // ignore
    }

    return false;
  }

  /**
   * Get the base URL
   */
  public override getBaseURL(): string {
    return super.getBaseURL();
  }

  /**
   * Get current authentication status for debugging
   */
  public getAuthStatus() {
    return {
      hasToken: !!this.getToken(),
      hasValidToken: TokenStorageManager.hasValidToken(),
      isExpiringSoon: TokenStorageManager.isTokenExpiringSoon(),
      timeToExpiry: TokenStorageManager.getTimeToExpiry(),
      isAuthenticated: this.isAuthenticated(),
      currentUser: this.currentUser,
    };
  }

  /**
   * Debug current token state (development only)
   */
  public debugTokenState(): void {
    if (process.env['NODE_ENV'] === 'development') {
      TokenStorageManager.debugTokenState();
    }
  }

  /**
   * Force refresh token (useful for testing)
   */
  public async forceRefreshToken(): Promise<boolean> {
    try {
      const response = await this.request<{ token: string; expiresIn: number }>('/auth/refresh', {
        method: 'POST',
        withCredentials: true,
      });

      if (response.success && response.data) {
        this.setToken(response.data.token, response.data.expiresIn);
        return true;
      }
    } catch (error) {
      // Force refresh failed
    }
    return false;
  }

  /**
   * Initialize auth state and restore user data
   * Call this method on app startup after creating the SDK instance
   */
  public async initializeAuthState(): Promise<boolean> {
    // Check if we have a valid token
    if (!TokenStorageManager.hasValidToken()) {
      // Try to restore session from refresh token
      const restored = await this.restoreSession();
      if (!restored) {
        return false;
      }
    }

    // If we have a token, try to get current user
    try {
      const userResponse = await this.getCurrentUser();
      if (userResponse.success && userResponse.user) {
        this.currentUser = userResponse.user;
        return true;
      }
    } catch (error) {
      // Failed to get current user during initialization
    }

    return false;
  }

  /**
   * Set the base URL
   */
  public override setBaseURL(baseURL: string): void {
    super.setBaseURL(baseURL);
  }
}
