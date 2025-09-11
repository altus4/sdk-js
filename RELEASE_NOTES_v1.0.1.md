# Altus 4 TypeScript SDK v1.0.1 🚀

**Official TypeScript SDK for Altus 4 - AI-Enhanced MySQL Full-Text Search Engine**

## 📦 Installation

```bash
npm install @altus4/sdk
```

## 🎯 What's New in v1.0.1

### 🐛 Bug Fixes

- Fixed repository URL format in package.json for proper npm registry integration
- Excluded test files from production build to reduce package size
- Resolved pre-commit hook compatibility issues with deprecated husky shim
- Fixed TypeScript compilation errors in utility functions

### 🔧 Improvements

- Optimized build process to exclude `*.test.ts` files from distribution
- Streamlined pre-commit hooks for better developer experience
- Enhanced package.json metadata for better npm discoverability
- Updated git repository configuration for proper GitHub integration

### 📊 Package Stats

- **Package Size**: 30.7 kB (compressed)
- **Unpacked Size**: 138.6 kB
- **Total Files**: 87
- **Test Coverage**: 95%+ statements, 87%+ branches

## 🌟 Key Features

### 🔐 Complete Authentication System

- JWT-based authentication with automatic token management
- User registration, login, and profile management
- Role-based access control with admin detection
- Automatic token refresh capabilities

### 🔑 API Key Management

- Create, update, and revoke API keys
- Tiered permission system (search, analytics, admin)
- Rate limiting with configurable tiers
- Usage tracking and monitoring

### 🗄️ Database Connection Management

- MySQL connection configuration and testing
- Schema discovery and health monitoring
- Connection pooling support
- Migration status tracking

### 📈 Analytics & Insights

- Search performance metrics and trends
- AI-powered query insights and suggestions
- Dashboard analytics with customizable time periods
- Real-time search statistics

### ⚙️ System Management

- Health checks and system status monitoring
- Migration management and progress tracking
- Configuration management
- Diagnostic tools and utilities

## 🛠️ Technical Specifications

### 📋 Requirements

- Node.js ≥ 14.0.0
- npm ≥ 6.0.0
- TypeScript ≥ 4.0.0 (peer dependency)

### 🏗️ Architecture

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Modular Design**: Use individual services or unified SDK interface
- **Error Handling**: Consistent error response formatting across all services
- **Browser Compatible**: Works in both Node.js and browser environments
- **Tree-Shakable**: ESM and CommonJS support for optimal bundling

### 🧪 Quality Assurance

- **74 Tests** across 16 test suites - all passing ✅
- **ESLint + Prettier** for consistent code formatting
- **Pre-commit hooks** for automated quality checks
- **Comprehensive TypeScript** strict mode configuration
- **Automated CI/CD** pipeline for testing and publishing

## 🚀 Quick Start Guide

```typescript
import { Altus4SDK } from '@altus4/sdk';

// Initialize the SDK
const altus4 = new Altus4SDK({
  baseURL: 'https://api.altus4.com/v1',
});

// Authenticate
const loginResult = await altus4.login('user@example.com', 'password');

if (loginResult.success) {
  // Create API key
  const apiKey = await altus4.apiKeys.createApiKey({
    name: 'My Integration',
    environment: 'production',
    permissions: ['search', 'analytics'],
  });

  // Get analytics
  const analytics = await altus4.analytics.getDashboardAnalytics({
    period: 'week',
  });

  console.log('Dashboard insights:', analytics);
}
```

## 📚 API Services Overview

| Service               | Description                      | Key Methods                                                |
| --------------------- | -------------------------------- | ---------------------------------------------------------- |
| **AuthService**       | User authentication & management | `login()`, `register()`, `getCurrentUser()`                |
| **ApiKeysService**    | API key lifecycle management     | `createApiKey()`, `listApiKeys()`, `revokeApiKey()`        |
| **DatabaseService**   | MySQL connection management      | `addConnection()`, `testConnection()`, `listConnections()` |
| **AnalyticsService**  | Search insights & metrics        | `getDashboardAnalytics()`, `getSearchTrends()`             |
| **ManagementService** | System monitoring & health       | `getSystemHealth()`, `getMigrationStatus()`                |

## 🔗 Links & Resources

- **📖 Documentation**: [GitHub Repository](https://github.com/altus4/sdk-js)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/altus4/sdk-js/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/altus4/sdk-js/discussions)
- **📦 npm Package**: [@altus4/sdk](https://www.npmjs.com/package/@altus4/sdk)

## 👥 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/altus4/sdk-js/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](https://github.com/altus4/sdk-js/blob/main/LICENSE) for details.

---

**Built with ❤️ by the Altus 4 Team**

_Making MySQL full-text search intelligent and powerful_
