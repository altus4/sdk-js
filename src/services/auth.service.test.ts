import { AuthService } from './auth.service';
import { TokenStorageManager } from '../utils/token-storage';

// Mock TokenStorageManager for Node.js environment
jest.mock('../utils/token-storage');
const mockTokenStorageManager = TokenStorageManager as jest.Mocked<typeof TokenStorageManager>;

// Minimal ClientConfig stub
const cfg = { baseURL: 'https://api.example.com/v1' } as any;

describe('AuthService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockTokenStorageManager.hasValidToken.mockReturnValue(false);
    mockTokenStorageManager.isTokenExpiringSoon.mockReturnValue(false);
    mockTokenStorageManager.getTokenData.mockReturnValue(null);
    mockTokenStorageManager.getToken.mockReturnValue(null);
  });

  test('setToken and clearToken change isAuthenticated', () => {
    const svc = new AuthService(cfg);

    expect(svc.isAuthenticated()).toBe(false);

    // Mock token storage to return valid token after setting
    mockTokenStorageManager.hasValidToken.mockReturnValue(true);
    svc.setToken('token-123', 3600);
    expect(svc.isAuthenticated()).toBe(true);

    // Mock token storage to return invalid token after clearing
    mockTokenStorageManager.hasValidToken.mockReturnValue(false);
    svc.clearToken();
    expect(svc.isAuthenticated()).toBe(false);
  });

  test('refreshTokenIfNeeded returns false when not near expiry', async () => {
    const svc = new AuthService(cfg);
    // set a token far in the future
    svc.setToken('token-abc', 3600 * 24);

    // spy on request to ensure not called
    const req = jest.spyOn<any, any>(svc as any, 'request');
    const refreshed = await svc.refreshTokenIfNeeded();
    expect(refreshed).toBe(false);
    expect(req).not.toHaveBeenCalled();
    req.mockRestore();
  });

  test('refreshTokenIfNeeded calls refresh when near expiry', async () => {
    const svc = new AuthService(cfg);

    // Mock token storage to indicate valid token that's expiring soon
    mockTokenStorageManager.hasValidToken.mockReturnValue(true);
    mockTokenStorageManager.isTokenExpiringSoon.mockReturnValue(true);

    svc.setToken('token-xyz', 1);

    // replace request to simulate refresh endpoint
    const mockResponse = { success: true, data: { token: 'new-token', expiresIn: 3600 } };
    const req = jest
      .spyOn<any, any>(svc as any, 'request')
      .mockImplementation(async () => mockResponse);

    const refreshed = await svc.refreshTokenIfNeeded();
    expect(refreshed).toBe(true);
    expect(req).toHaveBeenCalled();
    req.mockRestore();
  });

  test('handleLogin returns success and calls setToken on success', async () => {
    const svc = new AuthService(cfg);
    const mockData = { user: { id: 'u1' } as any, token: 't1', expiresIn: 3600 };
    const req = jest
      .spyOn<any, any>(svc as any, 'request')
      .mockResolvedValue({ success: true, data: mockData });
    const setSpy = jest.spyOn<any, any>(svc as any, 'setToken');

    const res = await svc.handleLogin({ email: 'a', password: 'b' } as any);
    expect(res.success).toBe(true);
    expect(res.token).toBe('t1');
    expect(setSpy).toHaveBeenCalledWith('t1', 3600);

    req.mockRestore();
    setSpy.mockRestore();
  });

  test('handleLogin returns failure when request fails', async () => {
    const svc = new AuthService(cfg);
    const req = jest
      .spyOn<any, any>(svc as any, 'request')
      .mockResolvedValue({ success: false, error: 'bad' });
    const res = await svc.handleLogin({ email: 'a', password: 'b' } as any);
    expect(res.success).toBe(false);
    expect(res.error).toBe('bad');
    req.mockRestore();
  });

  test('handleRegister sets token on success and returns failure on error', async () => {
    const svc = new AuthService(cfg);
    const mockData = { user: { id: 'u2' } as any, token: 't2', expiresIn: 1000 };
    const req = jest
      .spyOn<any, any>(svc as any, 'request')
      .mockResolvedValueOnce({ success: true, data: mockData });
    const setSpy = jest.spyOn<any, any>(svc as any, 'setToken');

    const res = await svc.handleRegister({ name: 'n' } as any);
    expect(res.success).toBe(true);
    expect(setSpy).toHaveBeenCalledWith('t2', 1000);

    // now simulate failure
    req.mockResolvedValueOnce({ success: false, error: 'exists' });
    const res2 = await svc.handleRegister({ name: 'n' } as any);
    expect(res2.success).toBe(false);
    expect(res2.error).toBe('exists');

    req.mockRestore();
    setSpy.mockRestore();
  });

  test('handleLogout clears token when success', async () => {
    const svc = new AuthService(cfg);
    svc.setToken('tok', 1000);
    const clearSpy = jest.spyOn<any, any>(svc as any, 'clearToken');
    const req = jest.spyOn<any, any>(svc as any, 'request').mockResolvedValue({ success: true });

    const res = await svc.handleLogout();
    expect(res.success).toBe(true);
    expect(clearSpy).toHaveBeenCalled();

    // failure path doesn't clear
    clearSpy.mockClear();
    req.mockResolvedValueOnce({ success: false, error: 'no' });
    const res2 = await svc.handleLogout();
    expect(res2.success).toBe(false);
    expect(clearSpy).not.toHaveBeenCalled();

    req.mockRestore();
    clearSpy.mockRestore();
  });

  test('getCurrentUser and updateProfile success/failure', async () => {
    const svc = new AuthService(cfg);
    const req = jest.spyOn<any, any>(svc as any, 'request');

    req.mockResolvedValueOnce({ success: true, data: { id: 'u' } });
    const u = await svc.getCurrentUser();
    expect(u.success).toBe(true);
    expect(u.user).toBeDefined();

    req.mockResolvedValueOnce({ success: false, error: 'no' });
    const u2 = await svc.getCurrentUser();
    expect(u2.success).toBe(false);

    // updateProfile
    req.mockResolvedValueOnce({ success: true, data: { id: 'u' } });
    const up = await svc.updateProfile({ name: 'x' } as any);
    expect(up.success).toBe(true);

    req.mockResolvedValueOnce({ success: false, error: 'bad' });
    const up2 = await svc.updateProfile({ name: 'x' } as any);
    expect(up2.success).toBe(false);

    req.mockRestore();
  });

  test('isAdmin relies on getCurrentUser result', async () => {
    const svc = new AuthService(cfg);
    const getSpy = jest.spyOn<any, any>(svc as any, 'getCurrentUser');
    getSpy.mockResolvedValueOnce({ success: true, user: { role: 'admin' } } as any);
    expect(await svc.isAdmin()).toBe(true);

    getSpy.mockResolvedValueOnce({ success: true, user: { role: 'user' } } as any);
    expect(await svc.isAdmin()).toBe(false);

    getSpy.mockResolvedValueOnce({ success: false } as any);
    expect(await svc.isAdmin()).toBe(false);

    getSpy.mockRestore();
  });

  test('setToken without expiry sets tokenExpiry null and isAuthenticated true', () => {
    const svc = new AuthService(cfg);

    // Mock token storage to return valid token after setting
    mockTokenStorageManager.hasValidToken.mockReturnValue(true);
    svc.setToken('abc');
    expect(svc.isAuthenticated()).toBe(true);
  });

  test('refreshTokenIfNeeded returns false when request fails or throws', async () => {
    const svc = new AuthService(cfg);
    // set token expiring soon
    svc.setToken('t', 1);
    const req = jest.spyOn<any, any>(svc as any, 'request');

    // returns unsuccessful
    req.mockResolvedValueOnce({ success: false });
    await new Promise(r => setTimeout(r, 20));
    const r1 = await svc.refreshTokenIfNeeded();
    expect(r1).toBe(false);

    // throws
    req.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    await new Promise(r => setTimeout(r, 20));
    const r2 = await svc.refreshTokenIfNeeded();
    expect(r2).toBe(false);

    req.mockRestore();
  });

  test('restoreSession returns true on successful refresh', async () => {
    const svc = new AuthService(cfg);
    const mockResponse = { success: true, data: { token: 'restored-token', expiresIn: 3600 } };
    const req = jest.spyOn<any, any>(svc as any, 'request').mockResolvedValue(mockResponse);
    const setTokenSpy = jest.spyOn<any, any>(svc as any, 'setToken');

    const result = await svc.restoreSession();
    expect(result).toBe(true);
    expect(req).toHaveBeenCalledWith('/auth/refresh', {
      method: 'POST',
      withCredentials: true,
    });
    expect(setTokenSpy).toHaveBeenCalledWith('restored-token', 3600);

    req.mockRestore();
    setTokenSpy.mockRestore();
  });

  test('restoreSession returns false on failed refresh', async () => {
    const svc = new AuthService(cfg);
    const req = jest
      .spyOn<any, any>(svc as any, 'request')
      .mockRejectedValue(new Error('Refresh failed'));

    const result = await svc.restoreSession();
    expect(result).toBe(false);

    req.mockRestore();
  });

  test('forceRefreshToken works like restoreSession', async () => {
    const svc = new AuthService(cfg);
    const mockResponse = { success: true, data: { token: 'forced-token', expiresIn: 1800 } };
    const req = jest.spyOn<any, any>(svc as any, 'request').mockResolvedValue(mockResponse);

    const result = await svc.forceRefreshToken();
    expect(result).toBe(true);

    req.mockRestore();
  });

  test('forceRefreshToken returns false on failure', async () => {
    const svc = new AuthService(cfg);
    const req = jest.spyOn<any, any>(svc as any, 'request').mockResolvedValue({ success: false });

    const result = await svc.forceRefreshToken();
    expect(result).toBe(false);

    req.mockRestore();
  });

  test('getAuthStatus returns current auth state', () => {
    const svc = new AuthService(cfg);

    // Mock the TokenStorageManager methods
    mockTokenStorageManager.hasValidToken.mockReturnValue(true);
    mockTokenStorageManager.isTokenExpiringSoon.mockReturnValue(false);
    mockTokenStorageManager.getTimeToExpiry.mockReturnValue(3600);

    // Mock getToken to return a token
    jest.spyOn<any, any>(svc as any, 'getToken').mockReturnValue('test-token');

    const status = svc.getAuthStatus();
    expect(status).toBeDefined();
    expect(status.hasToken).toBe(true);
    expect(status.hasValidToken).toBe(true);
    expect(status.isExpiringSoon).toBe(false);
    expect(status.timeToExpiry).toBe(3600);
    expect(status.isAuthenticated).toBe(true);
  });

  test('debugTokenState calls TokenStorageManager in development', () => {
    const svc = new AuthService(cfg);
    const originalEnv = process.env['NODE_ENV'];

    // Set development environment
    process.env['NODE_ENV'] = 'development';

    const debugSpy = jest.spyOn(mockTokenStorageManager, 'debugTokenState');

    svc.debugTokenState();
    expect(debugSpy).toHaveBeenCalled();

    // Restore original environment
    process.env['NODE_ENV'] = originalEnv;
    debugSpy.mockRestore();
  });

  test('debugTokenState does nothing in non-development', () => {
    const svc = new AuthService(cfg);
    const originalEnv = process.env['NODE_ENV'];

    // Set production environment
    process.env['NODE_ENV'] = 'production';

    const debugSpy = jest.spyOn(mockTokenStorageManager, 'debugTokenState');

    svc.debugTokenState();
    expect(debugSpy).not.toHaveBeenCalled();

    // Restore original environment
    process.env['NODE_ENV'] = originalEnv;
    debugSpy.mockRestore();
  });

  test('initializeAuthState with valid token and user', async () => {
    const svc = new AuthService(cfg);

    // Mock valid token
    mockTokenStorageManager.hasValidToken.mockReturnValue(true);

    // Mock successful user fetch
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const getUserSpy = jest.spyOn<any, any>(svc as any, 'getCurrentUser').mockResolvedValue({
      success: true,
      user: mockUser,
    });

    const result = await svc.initializeAuthState();
    expect(result).toBe(true);
    expect(getUserSpy).toHaveBeenCalled();

    getUserSpy.mockRestore();
  });

  test('initializeAuthState restores session when no valid token', async () => {
    const svc = new AuthService(cfg);

    // Mock no valid token initially
    mockTokenStorageManager.hasValidToken.mockReturnValue(false);

    // Mock successful session restoration
    const restoreSpy = jest.spyOn<any, any>(svc as any, 'restoreSession').mockResolvedValue(true);
    const getUserSpy = jest.spyOn<any, any>(svc as any, 'getCurrentUser').mockResolvedValue({
      success: true,
      user: { id: 'user1' },
    });

    const result = await svc.initializeAuthState();
    expect(result).toBe(true);
    expect(restoreSpy).toHaveBeenCalled();

    restoreSpy.mockRestore();
    getUserSpy.mockRestore();
  });

  test('initializeAuthState returns false when restoration fails', async () => {
    const svc = new AuthService(cfg);

    // Mock no valid token initially
    mockTokenStorageManager.hasValidToken.mockReturnValue(false);

    // Mock failed session restoration
    const restoreSpy = jest.spyOn<any, any>(svc as any, 'restoreSession').mockResolvedValue(false);

    const result = await svc.initializeAuthState();
    expect(result).toBe(false);

    restoreSpy.mockRestore();
  });

  test('setBaseURL delegates to parent', () => {
    const svc = new AuthService(cfg);
    const setSpy = jest.spyOn<any, any>(
      Object.getPrototypeOf(Object.getPrototypeOf(svc)),
      'setBaseURL'
    );

    svc.setBaseURL('https://new.api.com');
    expect(setSpy).toHaveBeenCalledWith('https://new.api.com');

    setSpy.mockRestore();
  });

  test('getBaseURL delegates to parent', () => {
    const svc = new AuthService(cfg);
    const getSpy = jest.spyOn<any, any>(
      Object.getPrototypeOf(Object.getPrototypeOf(svc)),
      'getBaseURL'
    );

    svc.getBaseURL();
    expect(getSpy).toHaveBeenCalled();

    getSpy.mockRestore();
  });
});
