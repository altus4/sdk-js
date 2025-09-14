/**
 * Management Service
 *
 * Handles system management operations including health checks and initial setup.
 */

import { BaseClient } from '../client/base-client';
import type { ClientConfig } from '../client/config';
import type {
  ConnectionTestResult,
  MigrationStatus,
  SetupRequest,
  SystemStatus,
} from '../types/management';
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
   * Backward-compatible alias used in docs
   */
  async getSystemHealth(): Promise<ApiResponse<SystemStatus>> {
    return this.getSystemStatus();
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
   * Migration status for authentication/system changes
   */
  async getMigrationStatus(): Promise<ApiResponse<MigrationStatus>> {
    return this.request('/management/migration-status');
  }

  /**
   * Create initial API key for new installations
   */
  async setupInitialApiKey(): Promise<ApiResponse<any>> {
    return this.request('/management/setup-initial-api-key', {
      method: 'POST',
    });
  }

  /**
   * Set the base URL
   */
  public override setBaseURL(baseURL: string): void {
    super.setBaseURL(baseURL);
  }
}
