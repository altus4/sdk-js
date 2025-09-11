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

export class AuthService extends BaseClient {
  private tokenExpiry: number | null = null;

  constructor(config: ClientConfig = {}) {
    super(config);
    // With cookie-based refresh flow, token is kept in memory and refresh is handled by server-side cookie
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
    const token = this.getToken();
    return token !== null && (this.tokenExpiry === null || Date.now() < this.tokenExpiry);
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
    // store access token in-memory via BaseClient and track expiry locally
    this.tokenExpiry = expiresIn ? Date.now() + expiresIn * 1000 : null;
    super.setToken(token, expiresIn);
  }

  /**
   * Clear authentication token
   */
  override clearToken(): void {
    this.token = null;
    this.tokenExpiry = null;
    super.clearToken();
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.token || !this.tokenExpiry) {
      return false;
    }

    const timeUntilExpiry = this.tokenExpiry - Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (timeUntilExpiry < fiveMinutes) {
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
   * Set the base URL
   */
  public override setBaseURL(baseURL: string): void {
    super.setBaseURL(baseURL);
  }
}
