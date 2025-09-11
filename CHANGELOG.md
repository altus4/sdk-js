# Changelog

All notable changes to the Altus 4 TypeScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2025-09-11

### Fixed

- Fixed repository URL format in package.json for proper npm registry integration
- Resolved pre-commit hook compatibility issues with deprecated husky shim
- Fixed TypeScript compilation errors in utility functions (charAt vs array access)
- Excluded test files from production build to reduce package size

### Changed

- Optimized build process to exclude `*.test.ts` files from distribution
- Streamlined pre-commit hooks for better developer experience
- Enhanced package.json metadata for better npm discoverability
- Updated git repository configuration for proper GitHub integration

### Technical

- Package size: 30.7 kB (compressed), 138.6 kB (unpacked)
- Test coverage: 95%+ statements, 87%+ branches, 74 tests passing
- Successfully published to npm registry as @altus4/sdk

## [1.0.0] - 2025-09-11

### Added

- **Authentication Service** - Complete JWT-based authentication with automatic token management
  - User login, registration, and profile management
  - JWT token handling with automatic refresh
  - Role-based access control and admin detection
- **API Keys Service** - Create, manage, and monitor API keys with tiered permissions
  - CRUD operations for API key lifecycle management
  - Tiered permission system (search, analytics, admin)
  - Rate limiting with configurable tiers and usage tracking
- **Database Service** - MySQL connection management with schema discovery
  - Connection configuration, testing, and health monitoring
  - Schema discovery and migration status tracking
  - Connection pooling support
- **Analytics Service** - Access to search analytics and AI-powered insights
  - Search performance metrics and trend analysis
  - AI-powered query insights and suggestions
  - Dashboard analytics with customizable time periods
- **Management Service** - System health checks and migration status
  - System health monitoring and diagnostics
  - Migration management and progress tracking
  - Configuration management tools
- **Type Safety** - Comprehensive TypeScript definitions for all APIs
  - Strict TypeScript configuration with full type coverage
  - Interface definitions for all request/response objects
  - Generic type support for flexible API usage
- **Utility Functions** - Validation, formatting, and date utilities
  - Email, password, and URL validation helpers
  - String formatting and sanitization functions
  - Date manipulation and formatting utilities
- **Development Tooling** - Complete development and testing setup
  - ESLint and Prettier for code quality
  - Jest testing framework with 74 comprehensive tests
  - Husky pre-commit hooks for automated quality checks
  - TypeScript strict mode configuration

### Features

- **Full TypeScript Support** - Strict type checking with comprehensive definitions
- **Modular Architecture** - Use individual services or unified SDK interface
- **Cross-Platform** - Compatible with Node.js and browser environments
- **Modern Module Support** - Both ESM and CommonJS exports
- **Error Handling** - Consistent error response formatting across all services
- **Automatic Token Management** - JWT refresh and storage handling
- **Built-in Validation** - Input validation utilities for common patterns
- **Tree-Shakable** - Optimized for modern bundlers with selective imports

### API Coverage

- **Authentication**: Login, register, profile management, token refresh
- **API Keys**: Create, list, update, revoke, monitor usage
- **Database**: Add connections, test connectivity, list databases, health checks
- **Analytics**: Dashboard data, search trends, performance insights
- **Management**: System health, migration status, configuration
