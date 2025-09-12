import { altus4, Altus4SDK, createAltus4SDK } from './index';
import { TokenStorageManager } from './utils/token-storage';

// Mock TokenStorageManager for Node.js environment
jest.mock('./utils/token-storage');
const mockTokenStorageManager = TokenStorageManager as jest.Mocked<typeof TokenStorageManager>;

describe('Altus4SDK', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockTokenStorageManager.hasValidToken.mockReturnValue(false);
    mockTokenStorageManager.isTokenExpiringSoon.mockReturnValue(false);
    mockTokenStorageManager.getTokenData.mockReturnValue(null);
    mockTokenStorageManager.getToken.mockReturnValue(null);
  });

  it('should instantiate successfully', () => {
    const sdk = new Altus4SDK({
      baseURL: 'https://api.example.com/v1',
    });

    expect(sdk).toBeInstanceOf(Altus4SDK);
    expect(sdk.getBaseURL()).toBe('https://api.example.com/v1');
  });

  it('should have all required services', () => {
    const sdk = new Altus4SDK();

    expect(sdk.auth).toBeDefined();
    expect(sdk.apiKeys).toBeDefined();
    expect(sdk.database).toBeDefined();
    expect(sdk.analytics).toBeDefined();
    expect(sdk.management).toBeDefined();
  });

  it('should handle authentication state', () => {
    const sdk = new Altus4SDK();

    expect(sdk.isAuthenticated()).toBe(false);

    // Mock token storage to return valid token after setting
    mockTokenStorageManager.hasValidToken.mockReturnValue(true);
    sdk.setToken('test-token', 3600);
    expect(sdk.isAuthenticated()).toBe(true);

    // Mock token storage to return invalid token after clearing
    mockTokenStorageManager.hasValidToken.mockReturnValue(false);
    sdk.clearToken();
    expect(sdk.isAuthenticated()).toBe(false);
  });

  it('should provide convenience authentication methods', async () => {
    const sdk = new Altus4SDK();

    // Mock auth service methods
    const loginSpy = jest.spyOn(sdk.auth, 'handleLogin').mockResolvedValue({
      success: true,
      user: { id: '1', email: 'test@example.com' } as any,
      token: 'token123',
    });

    const registerSpy = jest.spyOn(sdk.auth, 'handleRegister').mockResolvedValue({
      success: true,
      user: { id: '2', name: 'Test User' } as any,
      token: 'token456',
    });

    const logoutSpy = jest.spyOn(sdk.auth, 'handleLogout').mockResolvedValue({
      success: true,
    });

    // Test convenience methods
    const loginResult = await sdk.login('test@example.com', 'password');
    expect(loginSpy).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
    expect(loginResult.success).toBe(true);

    const registerResult = await sdk.register('Test User', 'test@example.com', 'password');
    expect(registerSpy).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password',
    });
    expect(registerResult.success).toBe(true);

    const logoutResult = await sdk.logout();
    expect(logoutSpy).toHaveBeenCalled();
    expect(logoutResult.success).toBe(true);

    // Clean up spies
    loginSpy.mockRestore();
    registerSpy.mockRestore();
    logoutSpy.mockRestore();
  });

  it('should provide user and admin methods', async () => {
    const sdk = new Altus4SDK();

    // Mock auth service methods
    const getCurrentUserSpy = jest.spyOn(sdk.auth, 'getCurrentUser').mockResolvedValue({
      success: true,
      user: { id: '1', role: 'user' } as any,
    });

    const isAdminSpy = jest.spyOn(sdk.auth, 'isAdmin').mockResolvedValue(false);

    const refreshSpy = jest.spyOn(sdk.auth, 'refreshTokenIfNeeded').mockResolvedValue(true);

    // Test methods
    const user = await sdk.getCurrentUser();
    expect(getCurrentUserSpy).toHaveBeenCalled();
    expect(user.success).toBe(true);

    const isAdmin = await sdk.isAdmin();
    expect(isAdminSpy).toHaveBeenCalled();
    expect(isAdmin).toBe(false);

    const refreshed = await sdk.refreshTokenIfNeeded();
    expect(refreshSpy).toHaveBeenCalled();
    expect(refreshed).toBe(true);

    // Clean up spies
    getCurrentUserSpy.mockRestore();
    isAdminSpy.mockRestore();
    refreshSpy.mockRestore();
  });

  it('should allow updating base URL for all services', () => {
    const sdk = new Altus4SDK();

    // Spy on setBaseURL for each service
    const authSpy = jest.spyOn(sdk.auth, 'setBaseURL');
    const apiKeysSpy = jest.spyOn(sdk.apiKeys, 'setBaseURL');
    const databaseSpy = jest.spyOn(sdk.database, 'setBaseURL');
    const analyticsSpy = jest.spyOn(sdk.analytics, 'setBaseURL');
    const managementSpy = jest.spyOn(sdk.management, 'setBaseURL');

    const newURL = 'https://new-api.example.com/v1';
    sdk.setBaseURL(newURL);

    // All services should have their base URL updated
    expect(authSpy).toHaveBeenCalledWith(newURL);
    expect(apiKeysSpy).toHaveBeenCalledWith(newURL);
    expect(databaseSpy).toHaveBeenCalledWith(newURL);
    expect(analyticsSpy).toHaveBeenCalledWith(newURL);
    expect(managementSpy).toHaveBeenCalledWith(newURL);

    // Clean up spies
    authSpy.mockRestore();
    apiKeysSpy.mockRestore();
    databaseSpy.mockRestore();
    analyticsSpy.mockRestore();
    managementSpy.mockRestore();
  });

  it('should provide testConnection method', async () => {
    const sdk = new Altus4SDK();

    const testConnectionSpy = jest.spyOn(sdk.management, 'testConnection').mockResolvedValue({
      success: true,
      data: { status: 'healthy' },
    });

    const result = await sdk.testConnection();
    expect(testConnectionSpy).toHaveBeenCalled();
    expect(result.success).toBe(true);

    testConnectionSpy.mockRestore();
  });
});

describe('createAltus4SDK', () => {
  it('should create SDK instance with config', () => {
    const config = { baseURL: 'https://custom.api.com/v1' };
    const sdk = createAltus4SDK(config);

    expect(sdk).toBeInstanceOf(Altus4SDK);
    expect(sdk.getBaseURL()).toBe('https://custom.api.com/v1');
  });

  it('should create SDK instance with default config', () => {
    const sdk = createAltus4SDK();

    expect(sdk).toBeInstanceOf(Altus4SDK);
    expect(sdk.getBaseURL()).toBe('http://localhost:3000/api/v1'); // default from BaseClient
  });
});

describe('default SDK instance', () => {
  it('should export a default SDK instance', () => {
    expect(altus4).toBeInstanceOf(Altus4SDK);
  });
});
