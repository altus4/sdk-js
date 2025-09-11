/**
 * Management Service
 *
 * Handles system management operations including health checks and initial setup.
 */

import { BaseClient } from '../client/base-client';
import type { ClientConfig } from '../client/config';
import type { ConnectionTestResult, SetupRequest, SystemStatus } from '../types/management';
import type { ApiResponse } from '../types/common';

export class ManagementService extends BaseClient {
  constructor(config: ClientConfig = {}) {
    super(config);
  }

  /**
   * Test connection to the API
   */
  async testConnection(): Promise<ApiResponse<ConnectionTestResult>> {
    return this.request('/health');
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
    return this.request('/status');
  }

  /**
   * Setup initial configuration
   */
  async setup(setupData: SetupRequest): Promise<ApiResponse<any>> {
    return this.request('/management/setup', {
      method: 'POST',
      data: setupData,
    });
  }

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<ApiResponse<any>> {
    return this.request('/metrics');
  }

  /**
   * Set the base URL
   */
  public override setBaseURL(baseURL: string): void {
    super.setBaseURL(baseURL);
  }
}
