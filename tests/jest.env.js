/**
 * Environment setup for integration tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.ALTUS4_TEST_MODE = 'integration';

// Default test API configuration
process.env.ALTUS4_TEST_BASE_URL =
  process.env.ALTUS4_TEST_BASE_URL || 'https://api-test.altus4.com/v1';
process.env.ALTUS4_TEST_TIMEOUT = process.env.ALTUS4_TEST_TIMEOUT || '10000';

// Test credentials (use environment variables for real integration tests)
process.env.ALTUS4_TEST_EMAIL = process.env.ALTUS4_TEST_EMAIL || 'test@altus4.example.com';
process.env.ALTUS4_TEST_PASSWORD = process.env.ALTUS4_TEST_PASSWORD || 'test-password-123';
process.env.ALTUS4_TEST_API_KEY = process.env.ALTUS4_TEST_API_KEY || 'test-api-key-123';

// Database test configuration
process.env.ALTUS4_TEST_DB_HOST = process.env.ALTUS4_TEST_DB_HOST || 'localhost';
process.env.ALTUS4_TEST_DB_PORT = process.env.ALTUS4_TEST_DB_PORT || '3306';
process.env.ALTUS4_TEST_DB_NAME = process.env.ALTUS4_TEST_DB_NAME || 'altus4_test';
process.env.ALTUS4_TEST_DB_USER = process.env.ALTUS4_TEST_DB_USER || 'test_user';
process.env.ALTUS4_TEST_DB_PASS = process.env.ALTUS4_TEST_DB_PASS || 'test_password';
