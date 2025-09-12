/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.integration.ts'],
  // Environment variables for integration tests (loaded first)
  setupFiles: ['<rootDir>/tests/jest.env.js'],
  // Test setup (loaded after environment)
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  clearMocks: true,
  restoreMocks: true,
  // Integration tests may need more time
  testTimeout: 30000,
  // Run tests serially to avoid conflicts with shared resources
  maxConcurrency: 1,
  verbose: true,
};
