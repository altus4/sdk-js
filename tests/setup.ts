/**
 * Jest setup file for Altus 4 SDK tests
 */

// Global test configuration
global.console = {
  ...console,
  // Suppress console.warn and console.error in tests unless explicitly needed
  warn: jest.fn(),
  error: jest.fn(),
};

// Only mock axios for unit tests, not integration tests
if (process.env.ALTUS4_TEST_MODE !== 'integration') {
  jest.mock('axios', () => ({
    create: jest.fn(() => ({
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  }));
}

// Mock localStorage for browser environment tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Only define localStorage if we're in a browser-like environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
} else {
  // For Node.js environment, create a global localStorage mock
  (global as any).localStorage = localStorageMock;
}

// Set test timeout
jest.setTimeout(10000);
