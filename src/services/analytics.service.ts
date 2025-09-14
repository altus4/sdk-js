/**
 * Analytics Service
 */

import { BaseClient } from '../client/base-client';
import type { ClientConfig } from '../client/config';
import type {
  AnalyticsData,
  AnalyticsInsights,
  AnalyticsQuery,
  AnalyticsTrends,
  DashboardAnalyticsRequest,
  InsightsRequest,
  PerformanceMetricsRequest,
  TrendsRequest,
} from '../types/analytics';
import type { ApiResponse } from '../types/common';

export class AnalyticsService extends BaseClient {
  constructor(config: ClientConfig = {}) {
    super(config);
  }

  /**
   * Get dashboard analytics data
   */
  async getDashboardAnalytics(
    request: DashboardAnalyticsRequest
  ): Promise<ApiResponse<AnalyticsData>> {
    return this.request('/analytics/dashboard', {
      method: 'GET',
      params: request,
    });
  }

  /**
   * Get analytics trends
   */
  async getTrends(request: TrendsRequest): Promise<ApiResponse<AnalyticsTrends>> {
    return this.request('/analytics/trends', {
      method: 'GET',
      params: request,
    });
  }

  /**
   * Get AI-generated insights
   */
  async getInsights(request: InsightsRequest): Promise<ApiResponse<AnalyticsInsights>> {
    return this.request('/analytics/insights', {
      method: 'GET',
      params: request,
    });
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(request: PerformanceMetricsRequest): Promise<ApiResponse<any>> {
    return this.request('/analytics/performance', {
      method: 'GET',
      params: request,
    });
  }

  /**
   * Get search history
   */
  async getSearchHistory(query?: AnalyticsQuery): Promise<ApiResponse<any[]>> {
    return this.request('/analytics/history', {
      method: 'GET',
      params: query,
    });
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(period: string = 'week'): Promise<ApiResponse<any>> {
    return this.request('/analytics/usage', {
      method: 'GET',
      params: { period },
    });
  }

  /**
   * Set the base URL
   */
  public override setBaseURL(baseURL: string): void {
    super.setBaseURL(baseURL);
  }
}
