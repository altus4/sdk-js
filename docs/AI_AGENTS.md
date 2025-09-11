# AI Agents Integration Guide

This guide provides comprehensive documentation for AI agents integrating with the Altus 4 TypeScript SDK. Whether you're building automated systems, chatbots, or intelligent workflows, this guide will help you implement robust and efficient integrations.

## Overview

The Altus 4 SDK is designed with AI agents in mind, providing:
- **Programmatic API access** for automated operations
- **Robust error handling** for autonomous systems
- **Rate limiting awareness** for respectful API usage
- **Comprehensive logging** for debugging and monitoring
- **Type-safe operations** for reliable automation

## Quick Start for AI Agents

```typescript
import { Altus4SDK } from '@altus4/sdk';

// Initialize SDK for AI agent use
const altus4 = new Altus4SDK({
  baseURL: process.env.ALTUS4_API_URL || 'https://api.altus4.com/api/v1',
  timeout: 30000, // 30 seconds for AI agent operations
});

// Authenticate using API key (recommended for agents)
altus4.setApiKey(process.env.ALTUS4_API_KEY);

// Example: Automated search analytics collection
async function collectSearchAnalytics() {
  try {
    const analytics = await altus4.analytics.getDashboardAnalytics({
      period: 'week',
    });
    
    if (analytics.success) {
      return analytics.data;
    } else {
      throw new Error(`Analytics collection failed: ${analytics.error?.message}`);
    }
  } catch (error) {
    console.error('Failed to collect analytics:', error);
    throw error;
  }
}
```

## Authentication for AI Agents

### API Key Authentication (Recommended)

API keys are the preferred authentication method for AI agents due to their:
- Long-term validity
- Specific permission scoping
- Rate limiting controls
- Usage tracking capabilities

```typescript
// Set API key for agent authentication
altus4.setApiKey(process.env.ALTUS4_API_KEY);

// Verify authentication
async function verifyAgentAuth() {
  try {
    const health = await altus4.management.getSystemHealth();
    if (health.success) {
      console.log('Agent authenticated successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
}
```

### JWT Token Authentication (Short-term)

For short-lived operations or user-delegated actions:

```typescript
// Authenticate with user credentials
const loginResult = await altus4.auth.handleLogin({
  email: process.env.ALTUS4_USER_EMAIL,
  password: process.env.ALTUS4_USER_PASSWORD,
});

if (loginResult.success) {
  // Token is automatically managed by the SDK
  console.log('User authentication successful');
} else {
  throw new Error('User authentication failed');
}
```

## Core Agent Operations

### 1. Search Analytics Automation

```typescript
interface AnalyticsReport {
  totalSearches: number;
  averageResponseTime: number;
  popularQueries: string[];
  trends: any[];
  timestamp: Date;
}

class AnalyticsAgent {
  constructor(private sdk: Altus4SDK) {}

  async generateDailyReport(): Promise<AnalyticsReport> {
    const [dashboard, popular, trends] = await Promise.all([
      this.sdk.analytics.getDashboardAnalytics({ period: 'day' }),
      this.sdk.analytics.getPopularQueries({ period: 'day' }),
      this.sdk.analytics.getSearchTrends({ period: 'day' }),
    ]);

    if (!dashboard.success || !popular.success || !trends.success) {
      throw new Error('Failed to fetch analytics data');
    }

    return {
      totalSearches: dashboard.data?.totalSearches || 0,
      averageResponseTime: dashboard.data?.averageResponseTime || 0,
      popularQueries: popular.data?.map(q => q.text) || [],
      trends: trends.data || [],
      timestamp: new Date(),
    };
  }

  async detectAnomalies(): Promise<boolean> {
    const currentMetrics = await this.generateDailyReport();
    const weeklyMetrics = await this.sdk.analytics.getDashboardAnalytics({ 
      period: 'week' 
    });

    if (!weeklyMetrics.success) {
      return false;
    }

    const avgWeeklySearches = weeklyMetrics.data?.totalSearches || 0;
    const dailySearches = currentMetrics.totalSearches;

    // Alert if daily searches are 50% below weekly average
    return dailySearches < (avgWeeklySearches * 0.5);
  }
}
```

### 2. Database Management Automation

```typescript
class DatabaseAgent {
  constructor(private sdk: Altus4SDK) {}

  async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const connections = await this.sdk.database.listDatabaseConnections();
    
    if (!connections.success) {
      return { healthy: false, issues: ['Failed to fetch connections'] };
    }

    const issues: string[] = [];
    const testResults = await Promise.allSettled(
      connections.data?.map(conn => 
        this.sdk.database.testDatabaseConnection(conn.id)
      ) || []
    );

    testResults.forEach((result, index) => {
      if (result.status === 'rejected' || !result.value.data?.connected) {
        const connName = connections.data?.[index]?.name || `Connection ${index}`;
        issues.push(`${connName} is not responding`);
      }
    });

    return {
      healthy: issues.length === 0,
      issues,
    };
  }

  async autoDiscoverSchema(connectionId: string): Promise<void> {
    try {
      const schema = await this.sdk.database.getDatabaseSchema(connectionId);
      
      if (schema.success) {
        console.log(`Discovered ${schema.data?.length || 0} tables`);
        
        // Log table information for monitoring
        schema.data?.forEach(table => {
          console.log(`Table: ${table.table}, Rows: ${table.estimatedRows}`);
        });
      }
    } catch (error) {
      console.error('Schema discovery failed:', error);
      throw error;
    }
  }
}
```

### 3. API Key Management Automation

```typescript
class ApiKeyAgent {
  constructor(private sdk: Altus4SDK) {}

  async rotateExpiredKeys(): Promise<void> {
    const keys = await this.sdk.apiKeys.listApiKeys();
    
    if (!keys.success) {
      throw new Error('Failed to fetch API keys');
    }

    const now = new Date();
    const expiredKeys = keys.data?.filter(key => {
      if (!key.expiresAt) return false;
      return new Date(key.expiresAt) <= now;
    }) || [];

    for (const expiredKey of expiredKeys) {
      try {
        // Create new key with same permissions
        const newKey = await this.sdk.apiKeys.createApiKey({
          name: `${expiredKey.name} (rotated)`,
          environment: expiredKey.environment,
          permissions: expiredKey.permissions,
          rateLimitTier: expiredKey.rateLimitTier,
        });

        if (newKey.success) {
          // Revoke old key
          await this.sdk.apiKeys.revokeApiKey(expiredKey.id);
          console.log(`Rotated key: ${expiredKey.name}`);
        }
      } catch (error) {
        console.error(`Failed to rotate key ${expiredKey.name}:`, error);
      }
    }
  }

  async monitorUsage(): Promise<{ alerts: string[] }> {
    const keys = await this.sdk.apiKeys.listApiKeys();
    const alerts: string[] = [];

    if (!keys.success) {
      return { alerts: ['Failed to fetch API keys'] };
    }

    for (const key of keys.data || []) {
      try {
        const usage = await this.sdk.apiKeys.getApiKeyUsage(key.id);
        
        if (usage.success && usage.data) {
          const { rateLimitRemaining, rateLimitTotal } = usage.data;
          const usagePercentage = ((rateLimitTotal - rateLimitRemaining) / rateLimitTotal) * 100;

          if (usagePercentage > 90) {
            alerts.push(`${key.name} is at ${usagePercentage.toFixed(1)}% usage`);
          }
        }
      } catch (error) {
        alerts.push(`Failed to check usage for ${key.name}`);
      }
    }

    return { alerts };
  }
}
```

## Error Handling for AI Agents

### Comprehensive Error Handling Pattern

```typescript
interface AgentError {
  type: 'network' | 'authentication' | 'rate_limit' | 'validation' | 'server';
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

class AgentErrorHandler {
  static handleError(error: any): AgentError {
    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
      return {
        type: 'network',
        message: error.message || 'Network connection failed',
        retryable: true,
      };
    }

    // Authentication errors
    if (error.code === 'AUTHENTICATION_FAILED' || error.code === 'INVALID_TOKEN') {
      return {
        type: 'authentication',
        message: 'Authentication failed - check credentials',
        retryable: false,
      };
    }

    // Rate limiting
    if (error.code === 'RATE_LIMITED') {
      return {
        type: 'rate_limit',
        message: 'Rate limit exceeded',
        retryable: true,
        retryAfter: error.retryAfter || 60000, // Default 1 minute
      };
    }

    // Validation errors
    if (error.code === 'VALIDATION_ERROR') {
      return {
        type: 'validation',
        message: error.message || 'Request validation failed',
        retryable: false,
      };
    }

    // Server errors
    return {
      type: 'server',
      message: error.message || 'Server error occurred',
      retryable: true,
    };
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
class RetryableAgent {
  constructor(private sdk: Altus4SDK) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const agentError = AgentErrorHandler.handleError(error);

        // Don't retry non-retryable errors
        if (!agentError.retryable) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = agentError.retryAfter || (baseDelay * Math.pow(2, attempt));
        
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Example usage
  async robustAnalyticsCall() {
    return this.executeWithRetry(
      () => this.sdk.analytics.getDashboardAnalytics({ period: 'day' }),
      3, // max 3 retries
      2000 // start with 2 second delay
    );
  }
}
```

## Rate Limiting and Throttling

### Intelligent Rate Limiting

```typescript
class ThrottledAgent {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private requestInterval = 1000; // 1 request per second

  constructor(private sdk: Altus4SDK) {}

  async queueRequest<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const operation = this.requestQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Queued operation failed:', error);
        }
        
        // Wait before next request
        if (this.requestQueue.length > 0) {
          await this.sleep(this.requestInterval);
        }
      }
    }

    this.isProcessing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Example usage
  async getAnalyticsThrottled() {
    return this.queueRequest(() => 
      this.sdk.analytics.getDashboardAnalytics({ period: 'day' })
    );
  }
}
```

## Monitoring and Logging

### Comprehensive Agent Monitoring

```typescript
interface AgentMetrics {
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastActivity: Date;
  errors: Array<{ timestamp: Date; error: string }>;
}

class MonitoredAgent {
  private metrics: AgentMetrics = {
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastActivity: new Date(),
    errors: [],
  };

  constructor(private sdk: Altus4SDK) {}

  async executeWithMonitoring<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      // Record success
      this.metrics.successfulRequests++;
      this.recordResponseTime(Date.now() - startTime);
      this.metrics.lastActivity = new Date();
      
      console.log(`✅ ${operationName} succeeded in ${Date.now() - startTime}ms`);
      return result;
      
    } catch (error) {
      // Record failure
      this.metrics.failedRequests++;
      this.metrics.errors.push({
        timestamp: new Date(),
        error: error.message || 'Unknown error',
      });
      this.metrics.lastActivity = new Date();
      
      console.error(`❌ ${operationName} failed:`, error);
      throw error;
    }
  }

  private recordResponseTime(responseTime: number): void {
    const totalRequests = this.metrics.successfulRequests;
    const currentAverage = this.metrics.averageResponseTime;
    
    this.metrics.averageResponseTime = 
      ((currentAverage * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }

  // Health check with metrics
  async performHealthCheck(): Promise<boolean> {
    try {
      await this.executeWithMonitoring(
        () => this.sdk.management.getSystemHealth(),
        'Health Check'
      );
      return true;
    } catch {
      return false;
    }
  }
}
```

## Environment Configuration

### Environment-Aware Agent Setup

```typescript
interface AgentConfig {
  apiUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  rateLimit: number;
  environment: 'development' | 'staging' | 'production';
}

class ConfigurableAgent {
  private config: AgentConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): AgentConfig {
    return {
      apiUrl: process.env.ALTUS4_API_URL || 'https://api.altus4.com/api/v1',
      apiKey: process.env.ALTUS4_API_KEY || '',
      timeout: parseInt(process.env.ALTUS4_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.ALTUS4_RETRY_ATTEMPTS || '3'),
      rateLimit: parseInt(process.env.ALTUS4_RATE_LIMIT || '1000'),
      environment: (process.env.NODE_ENV as any) || 'development',
    };
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('ALTUS4_API_KEY environment variable is required');
    }

    if (!this.config.apiUrl) {
      throw new Error('ALTUS4_API_URL environment variable is required');
    }

    console.log(`🤖 Agent configured for ${this.config.environment} environment`);
  }

  createSDK(): Altus4SDK {
    const sdk = new Altus4SDK({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
    });

    sdk.setApiKey(this.config.apiKey);
    return sdk;
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }
}
```

## Production Deployment

### Containerized Agent Example

```dockerfile
# Dockerfile for AI Agent
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy agent code
COPY dist/ ./dist/
COPY config/ ./config/

# Create non-root user
RUN addgroup -g 1001 -S agent && \
    adduser -S agent -u 1001
USER agent

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start agent
CMD ["node", "dist/agent.js"]
```

### Docker Compose for Agent Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  altus4-agent:
    build: .
    environment:
      - NODE_ENV=production
      - ALTUS4_API_URL=${ALTUS4_API_URL}
      - ALTUS4_API_KEY=${ALTUS4_API_KEY}
      - ALTUS4_TIMEOUT=30000
      - ALTUS4_RETRY_ATTEMPTS=3
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "node", "dist/health-check.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Security Best Practices

### Secure Agent Implementation

```typescript
class SecureAgent {
  private sdk: Altus4SDK;
  private encryptionKey: string;

  constructor() {
    // Validate environment
    this.validateSecurityRequirements();
    
    // Initialize SDK with security measures
    this.sdk = new Altus4SDK({
      baseURL: process.env.ALTUS4_API_URL,
      timeout: 30000,
    });
    
    this.encryptionKey = process.env.ENCRYPTION_KEY || '';
    this.setupSecureDefaults();
  }

  private validateSecurityRequirements(): void {
    const requiredEnvVars = [
      'ALTUS4_API_KEY',
      'ALTUS4_API_URL',
      'ENCRYPTION_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
      }
    }

    // Validate API URL is HTTPS in production
    if (process.env.NODE_ENV === 'production' && 
        !process.env.ALTUS4_API_URL?.startsWith('https://')) {
      throw new Error('API URL must use HTTPS in production');
    }
  }

  private setupSecureDefaults(): void {
    // Set API key securely
    this.sdk.setApiKey(process.env.ALTUS4_API_KEY!);

    // Enable request logging for audit trail
    console.log('🔒 Secure agent initialized with encrypted communications');
  }

  // Secure credential storage
  private encryptSensitiveData(data: string): string {
    // Implement proper encryption here
    // This is a placeholder - use proper encryption library
    return Buffer.from(data).toString('base64');
  }

  private decryptSensitiveData(encryptedData: string): string {
    // Implement proper decryption here
    return Buffer.from(encryptedData, 'base64').toString();
  }

  // Audit logging
  private auditLog(action: string, details: any): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      agentId: process.env.AGENT_ID || 'unknown',
    };

    console.log('AUDIT:', JSON.stringify(auditEntry));
  }

  async performSecureOperation(operation: string): Promise<any> {
    this.auditLog('operation_start', { operation });
    
    try {
      // Perform operation based on type
      let result;
      switch (operation) {
        case 'analytics':
          result = await this.sdk.analytics.getDashboardAnalytics();
          break;
        case 'health':
          result = await this.sdk.management.getSystemHealth();
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      this.auditLog('operation_success', { operation, success: result.success });
      return result;
      
    } catch (error) {
      this.auditLog('operation_error', { operation, error: error.message });
      throw error;
    }
  }
}
```

## Testing AI Agents

### Comprehensive Agent Testing

```typescript
// tests/agent.test.ts
import { Altus4SDK } from '@altus4/sdk';
import { AnalyticsAgent } from '../src/analytics-agent';

describe('AnalyticsAgent', () => {
  let mockSDK: jest.Mocked<Altus4SDK>;
  let agent: AnalyticsAgent;

  beforeEach(() => {
    mockSDK = {
      analytics: {
        getDashboardAnalytics: jest.fn(),
        getPopularQueries: jest.fn(),
        getSearchTrends: jest.fn(),
      },
    } as any;

    agent = new AnalyticsAgent(mockSDK);
  });

  describe('generateDailyReport', () => {
    it('should generate report with valid data', async () => {
      // Mock successful responses
      mockSDK.analytics.getDashboardAnalytics.mockResolvedValue({
        success: true,
        data: { totalSearches: 100, averageResponseTime: 250 },
      });

      mockSDK.analytics.getPopularQueries.mockResolvedValue({
        success: true,
        data: [{ text: 'query1' }, { text: 'query2' }],
      });

      mockSDK.analytics.getSearchTrends.mockResolvedValue({
        success: true,
        data: [{ trend: 'data' }],
      });

      const report = await agent.generateDailyReport();

      expect(report).toEqual({
        totalSearches: 100,
        averageResponseTime: 250,
        popularQueries: ['query1', 'query2'],
        trends: [{ trend: 'data' }],
        timestamp: expect.any(Date),
      });
    });

    it('should handle API failures', async () => {
      mockSDK.analytics.getDashboardAnalytics.mockResolvedValue({
        success: false,
        error: { code: 'API_ERROR', message: 'API failed' },
      });

      await expect(agent.generateDailyReport()).rejects.toThrow(
        'Failed to fetch analytics data'
      );
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies when searches drop significantly', async () => {
      // Setup mocks for anomaly detection
      jest.spyOn(agent, 'generateDailyReport').mockResolvedValue({
        totalSearches: 50, // Low daily searches
        averageResponseTime: 250,
        popularQueries: [],
        trends: [],
        timestamp: new Date(),
      });

      mockSDK.analytics.getDashboardAnalytics.mockResolvedValue({
        success: true,
        data: { totalSearches: 700 }, // High weekly average (100/day)
      });

      const hasAnomaly = await agent.detectAnomalies();
      expect(hasAnomaly).toBe(true);
    });
  });
});
```

## Integration Examples

### Slack Bot Integration

```typescript
import { WebClient } from '@slack/web-api';
import { Altus4SDK } from '@altus4/sdk';

class SlackAgent {
  private slack: WebClient;
  private sdk: Altus4SDK;

  constructor() {
    this.slack = new WebClient(process.env.SLACK_TOKEN);
    this.sdk = new Altus4SDK({
      baseURL: process.env.ALTUS4_API_URL,
    });
    this.sdk.setApiKey(process.env.ALTUS4_API_KEY!);
  }

  async handleAnalyticsCommand(channelId: string): Promise<void> {
    try {
      const analytics = await this.sdk.analytics.getDashboardAnalytics({
        period: 'day',
      });

      if (analytics.success) {
        const message = `📊 *Daily Analytics Report*
        
• Total Searches: ${analytics.data?.totalSearches || 0}
• Average Response Time: ${analytics.data?.averageResponseTime || 0}ms
• Success Rate: ${analytics.data?.successRate || 0}%`;

        await this.slack.chat.postMessage({
          channel: channelId,
          text: message,
        });
      }
    } catch (error) {
      await this.slack.chat.postMessage({
        channel: channelId,
        text: `❌ Failed to fetch analytics: ${error.message}`,
      });
    }
  }
}
```

### Webhook Integration

```typescript
import express from 'express';
import { Altus4SDK } from '@altus4/sdk';

class WebhookAgent {
  private app = express();
  private sdk: Altus4SDK;

  constructor() {
    this.sdk = new Altus4SDK({
      baseURL: process.env.ALTUS4_API_URL,
    });
    this.sdk.setApiKey(process.env.ALTUS4_API_KEY!);
    
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // Webhook endpoint for analytics requests
    this.app.post('/webhook/analytics', async (req, res) => {
      try {
        const { period = 'day' } = req.body;
        
        const analytics = await this.sdk.analytics.getDashboardAnalytics({
          period,
        });

        if (analytics.success) {
          res.json({
            success: true,
            data: analytics.data,
          });
        } else {
          res.status(400).json({
            success: false,
            error: analytics.error,
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: error.message },
        });
      }
    });

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.sdk.management.getSystemHealth();
        res.json(health);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: error.message },
        });
      }
    });
  }

  start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`🤖 Webhook agent listening on port ${port}`);
    });
  }
}

// Start the webhook agent
const agent = new WebhookAgent();
agent.start();
```

This comprehensive documentation provides AI agents with everything they need to integrate effectively with the Altus 4 SDK, including authentication, error handling, rate limiting, monitoring, security, and practical implementation examples.