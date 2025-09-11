/**
 * Base HTTP client for the Altus 4 SDK
 *
 * Handles authentication, error formatting, CORS debugging, and common HTTP operations.
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ClientConfig } from './config';
import type { ApiResponse } from '../types/common';
import { TokenStorageManager } from '../utils/token-storage';

/**
 * Base client class that provides HTTP request functionality
 */
export class BaseClient {
  protected client: AxiosInstance;
  protected baseURL: string;
  // Keep access token in memory only. Refresh token should be HttpOnly cookie managed by server.
  protected token: string | null = null;
  private refreshInProgress = false;
  // The callback parameter name in the function type triggers a false-positive unused-var in ESLint
  // eslint-disable-next-line no-unused-vars
  private refreshQueue: Array<(success: boolean) => void> = [];

  constructor(config: ClientConfig = {}) {
    this.baseURL = config.baseURL || 'http://localhost:3000/api/v1';

    // Initialize token from storage on construction
    this.initializeTokenFromStorage();

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      config => {
        // Add authentication token if available
        const token = this.getToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        const status = error.response?.status;
        const originalRequest = error.config;

        // Don't try to refresh when the refresh endpoint itself failed
        if (
          status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/refresh')
        ) {
          originalRequest._retry = true;
          return this.attemptRefreshAndRetry(originalRequest, error);
        }

        if (status === 401) {
          // final fallback: clear in-memory token
          this.clearToken();
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Attempt to refresh the access token using server-side HttpOnly refresh cookie
   * and retry the original request. Ensures only one refresh request is in-flight.
   */
  private async attemptRefreshAndRetry(originalRequest: any, originalError: any) {
    if (this.refreshInProgress) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        this.refreshQueue.push((_success: boolean) => {
          if (_success) {
            // retry original request
            originalRequest.headers = originalRequest.headers || {};
            const token = this.getToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(this.client(originalRequest));
          } else {
            reject(originalError);
          }
        });
      });
    }

    this.refreshInProgress = true;

    try {
      // Call refresh endpoint - the browser will send HttpOnly refresh cookie automatically when using withCredentials
      const resp = await this.client.post('/auth/refresh', null, { withCredentials: true });
      if (resp?.data?.token) {
        this.setToken(resp.data.token);
        // Drain queue with success
        this.refreshQueue.forEach(cb => cb(true));
        this.refreshQueue = [];

        // Retry original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${this.getToken()}`;
        return this.client(originalRequest);
      }
    } catch (e) {
      // refresh failed
    }

    // Refresh failed — clear token and drain queue with failure
    this.clearToken();
    this.refreshQueue.forEach(cb => cb(false));
    this.refreshQueue = [];
    return Promise.reject(originalError);
  }

  /**
   * Make an authenticated HTTP request
   */
  protected async request<T = unknown>(
    endpoint: string,
    options: AxiosRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client({
        url: endpoint,
        ...options,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network request failed',
          details: error,
        },
      };
    }
  }

  /**
   * Initialize token from persistent storage on SDK instantiation
   */
  private initializeTokenFromStorage(): void {
    const token = TokenStorageManager.getToken();
    if (token) {
      this.token = token;
    }
  }

  /**
   * Get stored authentication token
   */
  protected getToken(): string | null {
    // First check enhanced token storage
    const storedToken = TokenStorageManager.getToken();
    if (storedToken) {
      this.token = storedToken; // Sync memory with storage
      return storedToken;
    }

    // Fallback to memory token
    return this.token;
  }

  /**
   * Store authentication token
   */
  protected setToken(token: string, expiresIn?: number): void {
    this.token = token;
    TokenStorageManager.saveToken(token, expiresIn);
  }

  /**
   * Clear authentication token
   */
  protected clearToken(): void {
    this.token = null;
    TokenStorageManager.clearToken();
  }

  /**
   * Get the base URL
   */
  public getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Set the base URL
   */
  public setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }
}
