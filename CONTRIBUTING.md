# Contributing to Altus 4 TypeScript SDK

Thank you for your interest in contributing to the Altus 4 TypeScript SDK! This document provides guidelines for contributing to this project.

## Development Setup

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Git

### Getting Started

1. **Fork the repository**

   ```bash
   git clone https://github.com/altus4/altus4-sdk-typescript.git
   cd altus4-sdk-typescript
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the build**

   ```bash
   npm run build
   ```

4. **Run tests**

   ```bash
   npm test
   ```

5. **Start development mode**

   ```bash
   npm run build:watch
   ```

## Development Workflow

### Code Style

We use ESLint and Prettier to maintain consistent code style:

```bash
# Check linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Testing

Write tests for all new functionality:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Type Checking

Ensure all TypeScript types are correct:

```bash
npm run typecheck
```

## Contribution Guidelines

### Reporting Issues

Before creating an issue, please:

1. Check if the issue already exists
2. Provide a clear description of the problem
3. Include steps to reproduce the issue
4. Specify your environment (Node.js version, OS, etc.)

### Submitting Pull Requests

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed
   - Ensure all tests pass

3. **Commit your changes**

   ```bash
   git commit -m "feat: add new feature description"
   ```

   Use conventional commit format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test additions/changes
   - `refactor:` for code refactoring
   - `chore:` for maintenance tasks

4. **Push and create a pull request**

   ```bash
   git push origin feature/your-feature-name
   ```

### Code Review Process

1. All pull requests require review before merging
2. Ensure CI checks pass
3. Address any feedback from reviewers
4. Maintain a clean commit history

## Code Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Provide comprehensive type definitions
- Avoid `any` types unless absolutely necessary
- Use proper JSDoc comments for public APIs

### Architecture Principles

- Follow the existing service-based architecture
- Maintain separation of concerns
- Keep dependencies minimal
- Ensure backward compatibility

### Error Handling

- Use consistent error response format
- Provide meaningful error messages
- Handle network failures gracefully
- Include proper error codes

### Testing Standards

- Write unit tests for all services
- Mock external dependencies
- Test error scenarios
- Maintain high code coverage (>80%)

## Documentation

### API Documentation

- Update README.md for new features
- Include code examples
- Document all public methods
- Maintain type definitions

### Code Comments

- Use JSDoc for public APIs
- Comment complex logic
- Explain business logic decisions
- Keep comments up to date

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Publishing

Only maintainers can publish releases:

```bash
# Build and publish to npm
npm run release

# Publish beta version
npm run release:beta
```

## Development Tools

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript Importer
- Jest
- GitLens

### Git Hooks

Pre-commit hooks are configured to:

- Run linting
- Format code
- Run type checking

## Getting Help

- Create an issue for bugs or feature requests
- Check existing documentation
- Review the parent Altus 4 API documentation

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.
