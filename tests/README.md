# Integration Tests

This directory contains comprehensive integration tests for the Altus 4 SDK. These tests verify that different parts of the SDK work together correctly and can communicate with the API as expected.

## Test Structure

### Test Categories

#### 1. Authentication Tests (`auth.integration.test.ts`)

Tests the complete authentication flow including:

- User login and registration
- Token management and refresh
- Session persistence
- Authentication state management
- Error handling and edge cases

#### 2. Service Integration Tests (`services.integration.test.ts`)

Tests integration between different SDK services:

- API Keys management
- Database connections
- Analytics and reporting
- System management
- Cross-service authentication
- Service error handling

#### 3. End-to-End Tests (`e2e.integration.test.ts`)

Tests complete workflows and real-world usage scenarios:

- Complete user onboarding flow
- Database setup and search implementation
- Analytics and monitoring setup
- Multi-user scenarios
- SDK lifecycle management

#### 4. Performance Tests (`performance.integration.test.ts`)

Tests performance characteristics and scalability:

- Response time SLAs
- Concurrent request handling
- Memory usage and resource management
- Network performance optimization
- Scalability limits

## Test Infrastructure

### Mock Server (`helpers/test-server.ts`)

A sophisticated mock HTTP server that simulates the Altus 4 API:

- Configurable endpoints with realistic responses
- Request/response validation
- Network delay simulation
- Error simulation capabilities
- Stateful behavior for testing flows

### Test Utilities (`helpers/test-utils.ts`)

Comprehensive utilities for integration testing:

- Test context management
- Data generators
- Assertion helpers
- Retry logic with exponential backoff
- Performance measurement
- Network simulation

### Configuration

- `jest.integration.config.js`: Jest configuration for integration tests
- `jest.env.js`: Environment setup and configuration
- `setup.ts`: Global test setup and mocks

## Running Integration Tests

### All Integration Tests

```bash
npm run test:integration
```

### Specific Test Categories

```bash
# Authentication tests only
npm run test:integration:auth

# Service integration tests only
npm run test:integration:services

# End-to-end workflow tests only
npm run test:integration:e2e

# Performance tests only
npm run test:integration:performance
```

### With Coverage

```bash
npm run test:coverage:integration
```

### All Tests (Unit + Integration)

```bash
npm run test:all
```

## Test Environment Configuration

### Environment Variables

The integration tests support several environment variables for configuration:

```bash
# Test mode (mock | integration | e2e)
ALTUS4_TEST_MODE=mock

# API configuration
ALTUS4_TEST_BASE_URL=https://api-test.altus4.com/v1
ALTUS4_TEST_TIMEOUT=10000

# Test credentials
ALTUS4_TEST_EMAIL=test@altus4.example.com
ALTUS4_TEST_PASSWORD=test-password-123
ALTUS4_TEST_API_KEY=test-api-key-123

# Database test configuration
ALTUS4_TEST_DB_HOST=localhost
ALTUS4_TEST_DB_PORT=3306
ALTUS4_TEST_DB_NAME=altus4_test
ALTUS4_TEST_DB_USER=test_user
ALTUS4_TEST_DB_PASS=test_password
```

### Test Modes

#### Mock Mode (Default)

- Uses in-memory mock server
- Fast execution
- Deterministic responses
- No external dependencies

#### Integration Mode

- Uses real test API endpoints
- Requires valid test environment
- Tests actual network communication
- Slower but more realistic

#### E2E Mode

- Full end-to-end testing
- Uses production-like environment
- Complete workflow validation
- Slowest but most comprehensive

## Test Data

### Default Test Data

The tests use predefined test data from `TestData` in `test-utils.ts`:

```typescript
const TestData = {
  user: {
    email: 'test@altus4.example.com',
    password: 'test-password-123',
    name: 'Test User',
  },
  apiKey: {
    name: 'Test API Key',
    environment: 'test',
    permissions: ['search', 'analytics'],
  },
  database: {
    name: 'Test Database',
    host: 'localhost',
    port: 3306,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
  },
};
```

### Custom Test Data

For specific tests requiring different data, you can:

1. Override test data in individual tests
2. Use data generators for dynamic data
3. Configure via environment variables

## Test Patterns

### Basic Integration Test Pattern

```typescript
describe('Feature Integration Tests', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
    await context.sdk.login(TestData.user.email, TestData.user.password);
  });

  afterEach(async () => {
    if (context) {
      await cleanupTestContext(context);
    }
  });

  it('should test feature integration', async () => {
    const { sdk } = context;

    const result = await sdk.someService.someMethod();

    Assertions.isValidApiResponse(result);
    expect(result.success).toBe(true);
  });
});
```

### Performance Test Pattern

```typescript
it('should meet performance requirements', async () => {
  const { sdk } = context;
  const measurer = new PerformanceMeasurer();

  const { result, duration } = await measurer.measure(async () => {
    return sdk.someService.someMethod();
  });

  expect(result.success).toBe(true);
  expect(duration).toBeLessThan(1000); // 1 second SLA
});
```

### Error Handling Test Pattern

```typescript
it('should handle errors gracefully', async () => {
  const { sdk, server } = context;

  // Configure server to return error
  server.addEndpoint({
    method: 'GET',
    path: '/error-endpoint',
    response: {
      status: 500,
      data: { success: false, error: { code: 'SERVER_ERROR' } },
    },
  });

  const result = await sdk.someService.someMethod();

  if (!result.success) {
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe('SERVER_ERROR');
  }
});
```

## Continuous Integration

### CI Configuration

The integration tests are designed to run in CI environments:

- Deterministic mock responses
- Configurable timeouts
- Parallel execution support
- Coverage reporting

### GitHub Actions Example

```yaml
- name: Run Integration Tests
  run: npm run test:integration
  env:
    ALTUS4_TEST_MODE: mock
    CI: true
```

## Best Practices

### 1. Test Isolation

- Each test is completely isolated
- Clean state before and after each test
- No shared state between tests

### 2. Realistic Scenarios

- Tests reflect real-world usage patterns
- Include error conditions and edge cases
- Test both success and failure paths

### 3. Performance Awareness

- Include performance assertions
- Monitor resource usage
- Test scalability limits

### 4. Maintainability

- Use helper functions for common operations
- Keep test data centralized
- Document complex test scenarios

### 5. Debugging Support

- Comprehensive error messages
- Performance timing information
- Debug-friendly test structure

## Troubleshooting

### Common Issues

#### Test Timeouts

- Increase timeout in `jest.integration.config.js`
- Check network connectivity
- Verify mock server configuration

#### Authentication Failures

- Verify test credentials
- Check token management
- Ensure proper test cleanup

#### Flaky Tests

- Add retry logic for network operations
- Use proper wait conditions
- Avoid time-dependent assertions

#### Performance Issues

- Run tests with fewer concurrent connections
- Check system resources
- Profile test execution

### Debug Mode

Enable verbose logging:

```bash
DEBUG=altus4:* npm run test:integration
```

### Test-Specific Debugging

Add logging to individual tests:

```typescript
console.log('Test state:', {
  authenticated: sdk.isAuthenticated(),
  baseUrl: sdk.getBaseURL(),
});
```

## Contributing

### Adding New Tests

1. Choose appropriate test category
2. Follow existing patterns
3. Include performance assertions
4. Add error handling tests
5. Update this documentation

### Modifying Existing Tests

1. Ensure backward compatibility
2. Update assertions if needed
3. Verify CI still passes
4. Document any breaking changes

### Test Data Management

1. Use centralized `TestData` object
2. Don't hardcode sensitive data
3. Support environment-specific configuration
4. Keep test data realistic but safe
