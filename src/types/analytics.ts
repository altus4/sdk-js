/**
 * Analytics and dashboard types for the Altus 4 SDK
 */

import type { Period, SearchMode, UserRole } from './common';

/**
 * Search analytics item in history
 */
export interface SearchAnalyticsItem {
  id: string;
  query: string;
  searchMode?: SearchMode;
  resultCount: number;
  executionTime: number;
  database: string;
  timestamp: Date;
}

/**
 * Search history response with pagination
 */
export interface SearchHistoryResponse {
  items: SearchAnalyticsItem[];
  total: number;
}

/**
 * Trend insights for a specific period
 */
export interface TrendInsight {
  period: Period;
  topQueries: string[];
  queryVolume: number;
  avgResponseTime: number;
  popularCategories: string[];
}

/**
 * Popular query statistics
 */
export interface PopularQuery {
  query_text: string;
  frequency: number;
  avg_time: number;
}

/**
 * Main analytics data structure
 */
export interface AnalyticsData {
  summary: {
    totalQueries: number;
    averageResponseTime: number;
    successRate: number;
    activeUsers: number;
    databasesSearched: number;
    topQuery?: string;
    queryDistribution?: Record<string, number>;
  };
  trends?: AnalyticsTrends;
  insights?: AnalyticsInsight[];
}

/**
 * Analytics trends data
 */
export interface AnalyticsTrends {
  period: Period;
  queryVolume: number;
  popularCategories?: string[];
  searchPatterns?: { query: string; count: number }[];
  growth?: { queryVolume: number };
  dailyBreakdown?: { date: string; queries: number }[];
}

/**
 * Analytics insights from AI
 */
export interface AnalyticsInsights {
  insights: AnalyticsInsight[];
}

/**
 * Individual analytics insight
 */
export interface AnalyticsInsight {
  title: string;
  description: string;
  confidence: number;
  category: string;
  action?: string;
  impact?: string;
}

/**
 * Analytics query parameters
 */
export interface AnalyticsQuery {
  period?: Period;
  startDate?: string;
  endDate?: string;
  database?: string;
  limit?: number;
}

/**
 * Dashboard analytics request
 */
export interface DashboardAnalyticsRequest {
  period: Period;
  includeInsights?: boolean;
  includeTrends?: boolean;
}

/**
 * Trends request parameters
 */
export interface TrendsRequest {
  period: Period;
  startDate?: string;
  endDate?: string;
}

/**
 * Insights request parameters
 */
export interface InsightsRequest {
  period: Period;
  categories?: string[];
  limit?: number;
}

/**
 * Performance metrics request
 */
export interface PerformanceMetricsRequest {
  period: Period;
  databases?: string[];
}

/**
 * AI-generated insight
 */
export interface Insight {
  type: string;
  confidence: number;
  description: string;
  actionable: boolean;
  data: Record<string, unknown>;
}

/**
 * Dashboard performance summary
 */
export interface DashboardPerformanceSummary {
  totalQueries: number;
  averageResponseTime: number;
  topQuery: string;
}

/**
 * Performance data point for time series
 */
export interface DashboardPerformancePoint {
  date: string; // YYYY-MM-DD
  query_count: number;
  avg_response_time: number;
}

/**
 * Complete performance metrics
 */
export interface PerformanceMetrics {
  timeSeriesData: DashboardPerformancePoint[];
  searchModeDistribution: Array<{
    search_mode: string;
    count: number;
    avg_time: number;
  }>;
  summary: {
    totalQueries: number;
    averageResponseTime: number;
    averageResults: number;
  };
}

/**
 * Dashboard performance data
 */
export interface DashboardPerformance {
  summary: DashboardPerformanceSummary;
  timeSeriesData: DashboardPerformancePoint[];
}

/**
 * Dashboard trends data
 */
export interface DashboardTrends {
  period: Period;
  topQueries: string[];
  queryVolume: number;
  avgResponseTime: number;
  popularCategories: string[];
}

/**
 * Complete dashboard analytics
 */
export interface DashboardAnalytics {
  trends?: DashboardTrends;
  performance?: DashboardPerformance;
  popularQueries?: PopularQuery[];
  insights?: Insight[];
  summary?: DashboardPerformanceSummary;
}

/**
 * System overview for admin users
 */
export interface SystemOverview {
  summary: {
    active_users: number;
    total_queries: number;
    avg_response_time: number;
    avg_results: number;
  };
  userGrowth: Array<{
    date: string;
    new_users: number;
  }>;
  queryVolume: Array<{
    date: string;
    query_count: number;
    active_users: number;
  }>;
  period: Period;
}

/**
 * User activity for admin monitoring
 */
export interface UserActivity {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  query_count: number;
  avg_response_time: number;
  last_query?: string;
  last_active?: string;
}

/**
 * System performance metrics for admin
 */
export interface SystemPerformanceMetrics {
  timeSeriesData: Array<{
    date: string;
    query_count: number;
    avg_response_time: number;
    max_response_time: number;
    active_users: number;
  }>;
  slowestQueries: Array<{
    query_text: string;
    execution_time_ms: number;
    result_count: number;
    created_at: string;
    user_email: string;
  }>;
  summary: {
    totalQueries: number;
    averageResponseTime: number;
    peakResponseTime: number;
  };
}

/**
 * Analytics query parameters
 */
export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  period?: Period;
}

/**
 * Analytics query parameters with pagination
 */
export interface PaginatedAnalyticsParams extends AnalyticsParams {
  limit?: number;
  offset?: number;
}

/**
 * Date range for analytics queries
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}
