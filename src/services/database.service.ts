/**
 * Database Service
 */

import { BaseClient } from '../client/base-client';
import type { ClientConfig } from '../client/config';
import type {
  AddDatabaseConnectionRequest,
  ConnectionTestResult,
  DatabaseConnection,
  DatabaseSchema,
  UpdateDatabaseConnectionRequest,
} from '../types/database';
import type { ApiResponse } from '../types/common';

export class DatabaseService extends BaseClient {
  constructor(config: ClientConfig = {}) {
    super(config);
  }

  /**
   * Add a new database connection
   */
  async addDatabaseConnection(
    connectionData: AddDatabaseConnectionRequest
  ): Promise<ApiResponse<DatabaseConnection>> {
    return this.request('/databases', {
      method: 'POST',
      data: connectionData,
    });
  }

  /**
   * List all database connections
   */
  async listDatabaseConnections(): Promise<ApiResponse<DatabaseConnection[]>> {
    return this.request('/databases');
  }

  /**
   * Get a specific database connection by ID
   */
  async getDatabaseConnection(connectionId: string): Promise<ApiResponse<DatabaseConnection>> {
    return this.request(`/databases/${connectionId}`);
  }

  /**
   * Update a database connection
   */
  async updateDatabaseConnection(
    connectionId: string,
    updates: UpdateDatabaseConnectionRequest
  ): Promise<ApiResponse<DatabaseConnection>> {
    return this.request(`/databases/${connectionId}`, {
      method: 'PUT',
      data: updates,
    });
  }

  /**
   * Remove a database connection
   */
  async removeDatabaseConnection(connectionId: string): Promise<ApiResponse<void>> {
    return this.request(`/databases/${connectionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection(connectionId: string): Promise<ApiResponse<ConnectionTestResult>> {
    return this.request(`/databases/${connectionId}/test`, {
      method: 'POST',
    });
  }

  /**
   * Get database schema
   */
  async getDatabaseSchema(connectionId: string): Promise<ApiResponse<DatabaseSchema>> {
    return this.request(`/databases/${connectionId}/schema`);
  }

  /**
   * Set the base URL
   */
  public override setBaseURL(baseURL: string): void {
    super.setBaseURL(baseURL);
  }
}
