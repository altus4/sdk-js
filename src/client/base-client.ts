/**
 * Base HTTP client for the Altus 4 SDK
 *
 * Handles authentication, error formatting, CORS debugging, and common HTTP operations.
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ClientConfig } from './config';
import type { ApiResponse } from '../types/common';

/**
 * Base client class that provides HTTP request functionality
 */
export class BaseClient {
  protected client: AxiosInstance;
  protected baseURL: string;

  constructor(config: ClientConfig = {}) {
    this.baseURL = config.baseURL || 'http://localhost:3000/api/v1';

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
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
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
   * Get stored authentication token
   */
  protected getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('altus4_token');
    }
    return null;
  }

  /**
   * Store authentication token
   */
  protected setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('altus4_token', token);
    }
  }

  /**
   * Clear authentication token
   */
  protected clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('altus4_token');
    }
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
