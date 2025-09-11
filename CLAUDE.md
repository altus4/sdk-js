# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
```bash
# Clean and build TypeScript to JavaScript
npm run build

# Build with file watching for development
npm run build:watch

# Clean dist directory
npm run clean

# Type checking without emitting files
npm run typecheck
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Code Quality
```bash
# Lint TypeScript files
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check
```

### Release
```bash
# Build and publish to npm
npm run release

# Publish beta version
npm run release:beta

# Prepare package for publishing
npm run prepack
```

## Project Architecture

This is a TypeScript SDK for the Altus 4 AI-Enhanced MySQL Full-Text Search Engine. The codebase follows a modular service-based architecture:

### Core Structure
```
src/
├── types/              # TypeScript type definitions and interfaces
├── client/             # Base HTTP client and configuration (BaseClient)
├── services/           # Individual API service classes
│   ├── auth.service.ts      # Authentication and user management
│   ├── api-keys.service.ts  # API key management
│   ├── database.service.ts  # Database connection management
│   ├── analytics.service.ts # Search analytics and insights
│   └── management.service.ts # System health and management
├── utils/              # Validation, formatting, and utility functions
└── index.ts            # Main SDK export and unified Altus4SDK class
```

### Key Classes
- **Altus4SDK**: Main unified interface that orchestrates all services
- **BaseClient**: HTTP client foundation with authentication and error handling
- **Individual Services**: AuthService, ApiKeysService, DatabaseService, AnalyticsService, ManagementService

### Dependencies
- **axios**: HTTP client library (only runtime dependency)
- Uses JWT-based authentication with automatic token management
- Targets ES2020 with CommonJS modules for Node.js and browser compatibility

## Configuration Files

### TypeScript Configuration
- **tsconfig.json**: Strict TypeScript settings targeting ES2020
- Outputs to `dist/` with declarations, source maps, and declaration maps
- Excludes tests from compilation

### Code Quality
- **ESLint**: Configured with TypeScript, Prettier integration, strict rules
- **Prettier**: 100-char line width, single quotes, 2-space tabs
- **Jest**: Testing with ts-jest preset, 50% coverage threshold
- **Husky**: Pre-commit hooks for linting and formatting

### Package Configuration
- **Dual exports**: CommonJS (`dist/index.js`) and ESM (`dist/index.esm.js`)
- **TypeScript declarations**: Exported via `dist/index.d.ts`
- **Node.js**: >= 14.0.0 requirement
- **Peer dependency**: TypeScript >= 4.0.0

## Development Notes

### Type Safety
- Uses strict TypeScript with comprehensive type definitions
- All API responses wrapped in `ApiResponse<T>` interface
- Strong typing for service methods, request/response interfaces

### Testing Strategy
- Tests located in `tests/` directory
- Uses Jest with ts-jest for TypeScript support
- Coverage reports in HTML, LCOV, and text formats
- Minimum 50% coverage threshold across all metrics

### Code Style
- Single quotes, semicolons required
- Consistent type imports with separate import statements
- Object shorthand and template literals preferred
- Sorted imports (case-insensitive)

### Service Architecture
Each service extends BaseClient and provides:
- Type-safe method interfaces
- Consistent error handling patterns
- Authentication token management
- Request/response validation

The SDK can be used as a unified interface via Altus4SDK class or individual services can be imported for granular usage.