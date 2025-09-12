import { TokenStorageManager } from './token-storage';

describe('TokenStorageManager', () => {
  beforeEach(() => {
    // Clean up any existing state
    TokenStorageManager.clearToken();

    // Mock window and localStorage for browser environment
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });

    const mockStorage: { [key: string]: string } = {};
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockStorage[key];
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up globals
    delete (global as any).window;
    delete (global as any).localStorage;
  });

  test('saveToken stores token with expiration', () => {
    const token = 'test-token-123';
    const expiresIn = 3600; // 1 hour

    TokenStorageManager.saveToken(token, expiresIn);

    const tokenData = TokenStorageManager.getTokenData();
    expect(tokenData).not.toBeNull();
    expect(tokenData?.token).toBe(token);
    expect(tokenData?.expiresAt).toBeGreaterThan(Date.now());
    expect(tokenData?.issuedAt).toBeLessThanOrEqual(Date.now());
  });

  test('saveToken stores token without expiration', () => {
    const token = 'perpetual-token';

    TokenStorageManager.saveToken(token);

    const tokenData = TokenStorageManager.getTokenData();
    expect(tokenData).not.toBeNull();
    expect(tokenData?.token).toBe(token);
    expect(tokenData?.expiresAt).toBeNull();
  });

  test('getToken returns token when valid', () => {
    const token = 'valid-token';
    TokenStorageManager.saveToken(token, 3600);

    expect(TokenStorageManager.getToken()).toBe(token);
  });

  test('getToken returns null when expired', () => {
    const token = 'expired-token';
    // Set token that expires in the past
    TokenStorageManager.saveToken(token, -1); // Negative expiresIn makes it expired

    expect(TokenStorageManager.getToken()).toBeNull();
  });

  test('hasValidToken returns correct status', () => {
    expect(TokenStorageManager.hasValidToken()).toBe(false);

    TokenStorageManager.saveToken('valid-token', 3600);
    expect(TokenStorageManager.hasValidToken()).toBe(true);

    TokenStorageManager.clearToken();
    expect(TokenStorageManager.hasValidToken()).toBe(false);
  });

  test('isTokenExpiringSoon detects expiring tokens', () => {
    // Token expiring in 2 minutes (should be considered expiring soon)
    TokenStorageManager.saveToken('expiring-token', 120);
    expect(TokenStorageManager.isTokenExpiringSoon()).toBe(true);

    // Token expiring in 10 minutes (should not be expiring soon)
    TokenStorageManager.saveToken('long-token', 600);
    expect(TokenStorageManager.isTokenExpiringSoon()).toBe(false);

    // Token with no expiration
    TokenStorageManager.saveToken('perpetual-token');
    expect(TokenStorageManager.isTokenExpiringSoon()).toBe(false);
  });

  test('getTimeToExpiry returns correct values', () => {
    // No token
    expect(TokenStorageManager.getTimeToExpiry()).toBe(0);

    // Token with 1 hour expiry
    TokenStorageManager.saveToken('timed-token', 3600);
    const timeToExpiry = TokenStorageManager.getTimeToExpiry();
    expect(timeToExpiry).toBeGreaterThan(3500);
    expect(timeToExpiry).toBeLessThanOrEqual(3600);

    // Token with no expiration
    TokenStorageManager.saveToken('perpetual-token');
    expect(TokenStorageManager.getTimeToExpiry()).toBe(0);
  });

  test('clearToken removes all token data', () => {
    TokenStorageManager.saveToken('to-be-cleared', 3600);
    expect(TokenStorageManager.hasValidToken()).toBe(true);

    TokenStorageManager.clearToken();
    expect(TokenStorageManager.hasValidToken()).toBe(false);
    expect(TokenStorageManager.getToken()).toBeNull();
    expect(TokenStorageManager.getTokenData()).toBeNull();
  });

  test('updateTokenData modifies existing token', () => {
    TokenStorageManager.saveToken('original-token', 1800);
    const originalData = TokenStorageManager.getTokenData();

    TokenStorageManager.updateTokenData({
      userId: 'user123',
      expiresAt: Date.now() + 7200000, // 2 hours from now
    });

    const updatedData = TokenStorageManager.getTokenData();
    expect(updatedData?.token).toBe('original-token');
    expect(updatedData?.userId).toBe('user123');
    expect(updatedData?.expiresAt).toBeGreaterThan(originalData?.expiresAt || 0);
  });

  test('works without window/localStorage (Node.js environment)', () => {
    // Remove browser globals
    delete (global as any).window;
    delete (global as any).localStorage;

    // All methods should work but return falsy values
    expect(TokenStorageManager.hasValidToken()).toBe(false);
    expect(TokenStorageManager.getToken()).toBeNull();
    expect(TokenStorageManager.getTokenData()).toBeNull();
    expect(TokenStorageManager.isTokenExpiringSoon()).toBe(false);
    expect(TokenStorageManager.getTimeToExpiry()).toBe(0);

    // Should not throw errors
    expect(() => {
      TokenStorageManager.saveToken('test-token');
      TokenStorageManager.clearToken();
      TokenStorageManager.updateTokenData({ userId: 'test' });
    }).not.toThrow();
  });

  test('handles localStorage errors gracefully', () => {
    // Mock localStorage to throw errors
    const mockLocalStorage = {
      getItem: jest.fn(() => {
        throw new Error('localStorage error');
      }),
      setItem: jest.fn(() => {
        throw new Error('localStorage error');
      }),
      removeItem: jest.fn(() => {
        throw new Error('localStorage error');
      }),
    };

    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Should not throw errors
    expect(() => {
      TokenStorageManager.saveToken('test-token');
      TokenStorageManager.getToken();
      TokenStorageManager.clearToken();
    }).not.toThrow();
  });

  test('validates token data structure', () => {
    // Test with invalid JSON in localStorage
    const mockStorage: { [key: string]: string } = {};
    mockStorage['altus4_auth_data'] = 'invalid-json';

    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockStorage[key];
        }),
      },
      writable: true,
    });

    expect(TokenStorageManager.getTokenData()).toBeNull();
  });

  test('memory storage takes precedence over localStorage', () => {
    const memoryToken = 'memory-token';
    const storageToken = 'storage-token';

    // First save to localStorage
    TokenStorageManager.saveToken(storageToken, 3600);

    // Then directly set memory (simulating another instance)
    if (typeof window !== 'undefined') {
      (window as any)['__altus4_token_memory__'] = {
        token: memoryToken,
        expiresAt: Date.now() + 3600000,
        issuedAt: Date.now(),
      };
    }

    // Should return memory token
    expect(TokenStorageManager.getToken()).toBe(memoryToken);
  });
});
