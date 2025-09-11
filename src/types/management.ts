/**
 * Management and system types for the Altus 4 SDK
 */

/**
 * System health status
 */
export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceStatus[];
  uptime: number;
  version: string;
}

/**
 * Individual service status
 */
export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  message?: string;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  connected: boolean;
  responseTime?: number;
  message?: string;
  timestamp: string;
}

/**
 * Setup request for initial configuration
 */
export interface SetupRequest {
  apiKey?: string;
  environment?: 'development' | 'staging' | 'production';
  features?: string[];
}
