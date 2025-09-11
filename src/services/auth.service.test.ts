import { AuthService } from './auth.service';

// Minimal ClientConfig stub
const cfg = { baseURL: 'https://api.example.com/v1' } as any;

describe('AuthService', () => {
  test('setToken and clearToken change isAuthenticated', () => {
    const svc = new AuthService(cfg);

    expect(svc.isAuthenticated()).toBe(false);

    svc.setToken('token-123', 3600);
    expect(svc.isAuthenticated()).toBe(true);

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
    // set a token that expires in 1 second
    svc.setToken('token-xyz', 1);

    // replace request to simulate refresh endpoint
    const mockResponse = { success: true, data: { token: 'new-token', expiresIn: 3600 } };
    const req = jest
      .spyOn<any, any>(svc as any, 'request')
      .mockImplementation(async () => mockResponse);

    // wait briefly so token is considered near expiry
    await new Promise(r => setTimeout(r, 50));

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
});
