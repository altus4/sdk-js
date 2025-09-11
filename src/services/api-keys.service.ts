/**
 * API Keys Service
 */

import { BaseClient } from '../client/base-client';
import type { ClientConfig } from '../client/config';
import type {
  ApiKey,
  ApiKeyUsage,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
} from '../types/api-keys';
import type { ApiResponse } from '../types/common';

export class ApiKeysService extends BaseClient {
  constructor(config: ClientConfig = {}) {
    super(config);
  }

  /**
   * Create a new API key
   */
  async createApiKey(
    keyData: CreateApiKeyRequest
  ): Promise<ApiResponse<{ apiKey: ApiKey; secretKey: string }>> {
    return this.request('/keys', {
      method: 'POST',
      data: keyData,
    });
  }

  /**
   * List all API keys
   */
  async listApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    return this.request('/keys');
  }

  /**
   * Update an API key
   */
  async updateApiKey(keyId: string, updates: UpdateApiKeyRequest): Promise<ApiResponse<ApiKey>> {
    return this.request(`/keys/${keyId}`, {
      method: 'PUT',
      data: updates,
    });
  }

  /**
   * Get API key usage
   */
  async getApiKeyUsage(keyId: string): Promise<ApiResponse<ApiKeyUsage>> {
    return this.request(`/keys/${keyId}/usage`);
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(keyId: string): Promise<ApiResponse<{ secretKey: string }>> {
    return this.request(`/keys/${keyId}/regenerate`, {
      method: 'POST',
    });
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string): Promise<ApiResponse<void>> {
    return this.request(`/keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Set the base URL
   */
  public override setBaseURL(baseURL: string): void {
    super.setBaseURL(baseURL);
  }
}
