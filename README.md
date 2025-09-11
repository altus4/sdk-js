# Altus 4 | TypeScript SDK

A comprehensive TypeScript SDK for the Altus 4 AI-Enhanced MySQL Full-Text Search Engine. This SDK provides type-safe access to search analytics, database management, and AI-powered insights.

## Overview

Altus 4 enhances MySQL's native FULLTEXT search capabilities with AI-powered optimizations, semantic understanding, and advanced analytics. This SDK enables developers to integrate these capabilities into their applications with full TypeScript support and modern development practices.

## Features

- **Complete Authentication** - JWT-based authentication with automatic token management
- **API Key Management** - Create, update, revoke, and monitor API keys with tiered permissions
- **Database Connections** - Manage MySQL connections with schema discovery and health monitoring
- **Analytics & Insights** - Access search trends, performance metrics, and AI-generated insights
- **System Management** - Health checks, migration status, and system monitoring
- **Type Safety** - Full TypeScript support with comprehensive type definitions
- **Modular Design** - Use individual services or the unified SDK interface
- **Utility Functions** - Built-in validation, formatting, and date helpers

## Installation

```bash
npm install @altus4/sdk
```

## Quick Start

```typescript
import { Altus4SDK } from './sdk';

// Initialize the SDK
const altus4 = new Altus4SDK({
  baseURL: 'https://api.altus4.com/api/v1',
});

// Authenticate user
const loginResult = await altus4.login('user@example.com', 'password');

if (loginResult.success) {
  console.log('Welcome', loginResult.user?.name);

  // Create an API key for service-to-service authentication
  const apiKey = await altus4.apiKeys.createApiKey({
    name: 'Dashboard Integration',
    environment: 'test',
    permissions: ['search', 'analytics'],
    rateLimitTier: 'free',
  });

  // Get analytics dashboard data
  const dashboard = await altus4.analytics.getDashboardAnalytics({
    period: 'week',
  });
}
```

## Architecture

The SDK is organized into modular services with a clean separation of concerns:

```
sdk/
├── types/           # TypeScript type definitions and interfaces
├── client/          # Base HTTP client and configuration
├── services/        # Individual API service classes
│   ├── auth.service.ts
│   ├── api-keys.service.ts
│   ├── database.service.ts
│   ├── analytics.service.ts
│   └── management.service.ts
├── utils/           # Validation, formatting, and utility functions
└── index.ts         # Main SDK export and unified interface
```

## API Reference

### Authentication Service

The AuthService handles user authentication, registration, and profile management.

#### Methods

**handleLogin(credentials: LoginRequest): Promise<AuthResult>**

Authenticate a user with email and password.

```typescript
const result = await altus4.auth.handleLogin({
  email: 'user@example.com',
  password: 'password123',
});

if (result.success) {
  console.log('User authenticated:', result.user);
  console.log('Token expires in:', result.expiresIn, 'seconds');
}
```

**handleRegister(userData: RegisterRequest): Promise<AuthResult>**

Register a new user account.

```typescript
const result = await altus4.auth.handleRegister({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securePassword123',
  role: 'user', // Optional: 'user' | 'admin'
});
```

**getCurrentUser(): Promise<{success: boolean; user?: User; error?: any}>**

Get the current authenticated user's profile.

```typescript
const userResponse = await altus4.auth.getCurrentUser();
if (userResponse.success) {
  console.log('Current user:', userResponse.user);
}
```

**updateProfile(updates: UpdateProfileRequest): Promise<{success: boolean; user?: User; error?: any}>**

Update the authenticated user's profile.

```typescript
await altus4.auth.updateProfile({
  name: 'John Smith',
  email: 'john.smith@example.com',
});
```

**isAuthenticated(): boolean**

Check if the user is currently authenticated.

```typescript
if (altus4.auth.isAuthenticated()) {
  // User is authenticated
}
```

### API Keys Service

The ApiKeysService manages API keys for service-to-service authentication.

#### Methods

**createApiKey(keyData: CreateApiKeyRequest): Promise<ApiResponse<ApiKey>>**

Create a new API key with specified permissions and rate limiting.

```typescript
const keyResponse = await altus4.apiKeys.createApiKey({
  name: 'Production API Key',
  environment: 'live',
  permissions: ['search', 'analytics'],
  rateLimitTier: 'pro',
  expiresAt: '2024-12-31',
  allowedIPs: ['192.168.1.0/24'], // Optional IP restrictions
});
```

**listApiKeys(): Promise<ApiResponse<ApiKey[]>>**

List all API keys for the authenticated user.

```typescript
const keys = await altus4.apiKeys.listApiKeys();
keys.data?.forEach(key => {
  console.log(`${key.name}: ${key.status}`);
});
```

**getApiKey(keyId: string): Promise<ApiResponse<ApiKey>>**

Get details for a specific API key.

```typescript
const key = await altus4.apiKeys.getApiKey('key-id-123');
```

**updateApiKey(keyId: string, updates: UpdateApiKeyRequest): Promise<ApiResponse<ApiKey>>**

Update an existing API key's settings.

```typescript
await altus4.apiKeys.updateApiKey('key-id-123', {
  name: 'Updated Key Name',
  permissions: ['search', 'analytics', 'admin'],
  rateLimitTier: 'enterprise',
});
```

**revokeApiKey(keyId: string): Promise<ApiResponse<{success: boolean}>>**

Revoke an API key, making it immediately invalid.

```typescript
await altus4.apiKeys.revokeApiKey('key-id-123');
```

**getApiKeyUsage(keyId: string): Promise<ApiResponse<ApiKeyUsage>>**

Get usage statistics for an API key.

```typescript
const usage = await altus4.apiKeys.getApiKeyUsage('key-id-123');
console.log('Requests today:', usage.data?.requestsToday);
console.log('Rate limit remaining:', usage.data?.rateLimitRemaining);
```

### Database Service

The DatabaseService manages MySQL database connections and schema discovery.

#### Methods

**addDatabaseConnection(connectionData: CreateDatabaseConnectionRequest): Promise<ApiResponse<DatabaseConnection>>**

Add a new database connection configuration.

```typescript
const connection = await altus4.database.addDatabaseConnection({
  name: 'Production Database',
  host: 'db.example.com',
  port: 3306,
  database: 'myapp_production',
  username: 'readonly_user',
  password: 'secure_password',
  ssl: true,
});
```

**listDatabaseConnections(): Promise<ApiResponse<DatabaseConnection[]>>**

List all configured database connections.

```typescript
const connections = await altus4.database.listDatabaseConnections();
```

**getDatabaseConnection(connectionId: string): Promise<ApiResponse<DatabaseConnection>>**

Get details for a specific database connection.

```typescript
const connection = await altus4.database.getDatabaseConnection('conn-123');
```

**updateDatabaseConnection(connectionId: string, updates: UpdateDatabaseConnectionRequest): Promise<ApiResponse<DatabaseConnection>>**

Update a database connection's configuration.

```typescript
await altus4.database.updateDatabaseConnection('conn-123', {
  name: 'Updated Connection Name',
  ssl: true,
});
```

**deleteDatabaseConnection(connectionId: string): Promise<ApiResponse<{success: boolean}>>**

Remove a database connection configuration.

```typescript
await altus4.database.deleteDatabaseConnection('conn-123');
```

**testDatabaseConnection(connectionId: string): Promise<ApiResponse<{connected: boolean; error?: string}>>**

Test connectivity to a configured database.

```typescript
const test = await altus4.database.testDatabaseConnection('conn-123');
if (test.data?.connected) {
  console.log('Database connection successful');
}
```

**getDatabaseSchema(connectionId: string): Promise<ApiResponse<TableSchema[]>>**

Discover the schema for a connected database.

```typescript
const schema = await altus4.database.getDatabaseSchema('conn-123');
schema.data?.forEach(table => {
  console.log(`Table: ${table.table} (${table.estimatedRows} rows)`);
});
```

### Analytics Service

The AnalyticsService provides access to search analytics and AI-powered insights.

#### Methods

**getDashboardAnalytics(params?: TimeRangeParams): Promise<ApiResponse<DashboardAnalytics>>**

Get comprehensive dashboard analytics data.

```typescript
const dashboard = await altus4.analytics.getDashboardAnalytics({
  period: 'month',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});

console.log('Total searches:', dashboard.data?.totalSearches);
console.log('Average response time:', dashboard.data?.averageResponseTime);
```

**getSearchTrends(params?: TimeRangeParams): Promise<ApiResponse<TrendInsight[]>>**

Get search trend analysis and patterns.

```typescript
const trends = await altus4.analytics.getSearchTrends({
  period: 'week',
});
```

**getPopularQueries(params?: TimeRangeParams): Promise<ApiResponse<PopularQuery[]>>**

Get the most popular search queries.

```typescript
const popular = await altus4.analytics.getPopularQueries({
  period: 'month',
});
```

**getSearchHistory(params?: SearchHistoryParams): Promise<ApiResponse<SearchAnalytics[]>>**

Get detailed search history with pagination.

```typescript
const history = await altus4.analytics.getSearchHistory({
  limit: 50,
  offset: 0,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});
```

**getInsights(params?: TimeRangeParams): Promise<ApiResponse<AIInsight[]>>**

Get AI-generated insights and recommendations.

```typescript
const insights = await altus4.analytics.getInsights({
  period: 'month',
});

insights.data?.forEach(insight => {
  if (insight.actionable) {
    console.log('Recommendation:', insight.description);
  }
});
```

### Management Service

The ManagementService provides system health checks and management operations.

#### Methods

**getSystemHealth(): Promise<ApiResponse<SystemHealth>>**

Check overall system health and status.

```typescript
const health = await altus4.management.getSystemHealth();
console.log('System status:', health.data?.status);
console.log('Uptime:', health.data?.uptime);
```

**testConnection(): Promise<ApiResponse<{connected: boolean}>>**

Test API connectivity and authentication.

```typescript
const test = await altus4.management.testConnection();
if (test.data?.connected) {
  console.log('API connection successful');
}
```

**getMigrationStatus(): Promise<ApiResponse<MigrationStatus>>**

Check migration status for new authentication system.

```typescript
const status = await altus4.management.getMigrationStatus();
if (!status.data?.hasMigrated) {
  console.log('Migration needed:', status.data?.recommendedAction);
}
```

**setupInitialApiKey(): Promise<ApiResponse<ApiKey>>**

Create initial API key for new users (requires JWT authentication).

```typescript
const initialKey = await altus4.management.setupInitialApiKey();
console.log('Initial API key created:', initialKey.data?.key);
```

## Utility Functions

The SDK includes comprehensive utility functions for common operations.

### Validation

```typescript
import { validateEmail, validatePassword, validateApiKeyCreation } from './sdk/utils';

// Email validation
const isValidEmail = validateEmail('user@example.com');

// Password strength validation
const passwordValidation = validatePassword('myPassword123!');
if (!passwordValidation.isValid) {
  console.log('Password errors:', passwordValidation.errors);
}

// API key creation validation
const keyValidation = validateApiKeyCreation({
  name: 'Test Key',
  environment: 'test',
  permissions: ['search'],
});
```

### Formatting

```typescript
import {
  formatNumber,
  formatResponseTime,
  formatRelativeTime,
  getRateLimitInfo,
} from './sdk/utils';

// Number formatting
console.log(formatNumber(1500)); // "1.5K"
console.log(formatNumber(2500000)); // "2.5M"

// Response time formatting
console.log(formatResponseTime(250)); // "250ms"
console.log(formatResponseTime(1500)); // "1.50s"

// Relative time formatting
const oneHourAgo = new Date(Date.now() - 3600000);
console.log(formatRelativeTime(oneHourAgo)); // "1 hour ago"

// Rate limit information
const rateLimitInfo = getRateLimitInfo('pro');
console.log(rateLimitInfo.description); // "10,000 requests per hour"
```

### Date Utilities

```typescript
import { getDateRangeForPeriod, formatDateForQuery } from './sdk/utils';

// Get date range for analytics periods
const monthRange = getDateRangeForPeriod('month');
console.log(monthRange); // { startDate: "2024-01-15", endDate: "2024-02-15" }

// Format dates for API queries
const queryDate = formatDateForQuery(new Date()); // "2024-02-15"
```

## Error Handling

The SDK provides consistent error handling patterns across all services:

```typescript
try {
  const result = await altus4.auth.handleLogin({
    email: 'user@example.com',
    password: 'wrongpassword',
  });

  if (!result.success) {
    // Handle API errors
    console.error('Login failed:', result.error?.message);
    console.error('Error code:', result.error?.code);
  }
} catch (error) {
  // Handle network or other errors
  console.error('Request failed:', error);
}
```

### Common Error Codes

- `AUTHENTICATION_FAILED` - Invalid credentials
- `TOKEN_EXPIRED` - JWT token has expired
- `INVALID_TOKEN` - Malformed or invalid token
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Request validation failed
- `NETWORK_ERROR` - Network or connectivity issues
- `RATE_LIMITED` - Rate limit exceeded

## Advanced Usage

### Individual Service Usage

```typescript
import { AuthService, ApiKeysService } from './sdk';

// Use services independently
const auth = new AuthService({
  baseURL: 'https://api.altus4.com/api/v1',
});

const apiKeys = new ApiKeysService({
  baseURL: 'https://api.altus4.com/api/v1',
});

const loginResult = await auth.handleLogin(credentials);
const keys = await apiKeys.listApiKeys();
```

### Custom Configuration

```typescript
const altus4 = new Altus4SDK({
  baseURL: 'https://custom-api.example.com/api/v1',
  timeout: 60000, // 60 seconds
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### Token Management

```typescript
// Manual token management
altus4.setToken('your-jwt-token', 3600); // 1 hour expiry

// Check authentication status
if (altus4.isAuthenticated()) {
  console.log('User is authenticated');
}

// Automatic token refresh
const refreshed = await altus4.refreshTokenIfNeeded();
if (!refreshed) {
  // Redirect to login or handle re-authentication
  console.log('Token refresh failed, re-authentication required');
}

// Clear authentication
altus4.clearToken();
```

## Type Definitions

The SDK is fully typed with comprehensive TypeScript definitions:

```typescript
import type {
  User,
  ApiKey,
  DatabaseConnection,
  DashboardAnalytics,
  CreateApiKeyRequest,
  TimeRangeParams,
  ApiResponse,
} from './sdk';

// All API responses are properly typed
const user: User | undefined = loginResult.user;
const analytics: DashboardAnalytics | undefined = dashboardResult.data;

// Request payloads are validated at compile time
const createKeyRequest: CreateApiKeyRequest = {
  name: 'My Key',
  environment: 'test', // Type enforced: 'test' | 'live'
  permissions: ['search', 'analytics'], // Type enforced array
  rateLimitTier: 'free', // Type enforced: 'free' | 'pro' | 'enterprise'
};
```

### Core Types

**User Interface**

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  connectedDatabases: string[];
  createdAt: Date;
  lastActive: Date;
}
```

**ApiKey Interface**

```typescript
interface ApiKey {
  id: string;
  name: string;
  key: string;
  environment: 'test' | 'live';
  permissions: Permission[];
  rateLimitTier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'revoked' | 'expired';
  expiresAt?: string;
  createdAt: Date;
  lastUsed?: Date;
}
```

**ApiResponse Wrapper**

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}
```

## Browser and Node.js Compatibility

The SDK is compatible with:

- **Browsers**: Chrome 70+, Firefox 65+, Safari 12+, Edge 79+
- **Node.js**: 14.0+
- **TypeScript**: 4.0+

## Development

### Building the SDK

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Run type checking
npm run typecheck

# Development mode with watch
npm run dev
```

### Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Configuration

### Environment Variables

For development, you can set default configuration via environment variables:

```bash
ALTUS4_API_URL=https://api.altus4.com/api/v1
ALTUS4_TIMEOUT=30000
```

### Configuration File

Create a configuration file for shared settings:

```typescript
// altus4.config.ts
export const altus4Config = {
  baseURL: process.env.ALTUS4_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  retryAttempts: 3,
};

// Use in your application
const altus4 = new Altus4SDK(altus4Config);
```

## Best Practices

1. **Error Handling**: Always check the `success` property of API responses
2. **Token Management**: Implement automatic token refresh for long-running applications
3. **Rate Limiting**: Respect rate limits and implement backoff strategies
4. **Security**: Never log or expose API keys or JWT tokens
5. **Validation**: Use the built-in validation utilities before making API calls
6. **Caching**: Cache frequently accessed data to reduce API calls
7. **Monitoring**: Track API usage and response times for performance optimization

## Support

For issues, questions, or contributions:

1. Check the existing documentation and type definitions
2. Review the parent Altus 4 API documentation
3. Follow the established code patterns and conventions
4. Ensure all changes maintain TypeScript compatibility
5. Add appropriate error handling and validation

## License

This SDK is part of the Altus 4 project and follows the same license terms as the main application.
