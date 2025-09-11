# Changelog

All notable changes to the Altus 4 TypeScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] - 2025-09-11

### Fixes (init)

- Persist authentication token to storage on login/register and clear it on logout by calling the base client storage helpers. This ensures tokens are written to `localStorage` and included in outgoing requests.

### Changes (build)

- Rebuilt `dist` and validated token persistence via smoke tests and unit tests.

### Notes (release notes)

- This is a critical bugfix release addressing session persistence and authorization header inclusion for browser consumers.

## [1.0.2] - 2025-09-11

### Fixes

- Resolved package entrypoint resolution issue: `package.json` no longer points at a non-existent `dist/index.esm.js` (now references the existing `dist/index.js`), preventing Vite/rollup resolver failures.
- Fixed `exports` and `module` fields in `package.json` to match distributed files so bundlers can resolve the package.

### Changes

- Bumped package version to `1.0.2` and created tag `v1.0.2` on GitHub.
- Made the `publish` workflow idempotent when the `package.json` version already matches the release tag (skip `npm version` if unchanged) to avoid CI failures.
- Removed automatic GitHub Release creation from the publish workflow; releases can now be created manually or via the GitHub CLI.

### Notes

- This release is primarily a packaging/CI fix to ensure downstream projects (for example Vite-based apps) can install and build against `@altus4/sdk` without resolver errors.

## [1.0.4] - 2025-09-11

### Fixes (critical)

- Restore persisted authentication token on SDK initialization so new instances (or page refreshes) automatically pick up the stored token and remain authenticated.

### Changes (behavior)

- Persist token expiry to `localStorage` and restore it when available; improved isAuthenticated() behavior after initialization.

### Notes (release)

- This is a critical UX fix ensuring sessions survive page refresh and new SDK instances behave consistently.

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
