import { Altus4SDK } from './index';
import * as services from './services';

describe('Altus4SDK convenience methods', () => {
  test('login/register/logout/getCurrentUser/isAdmin/refreshTokenIfNeeded delegate to auth service', async () => {
    const sdk = new Altus4SDK({} as any);

    const authProto = (services as any).AuthService.prototype;
    const loginSpy = jest
      .spyOn(authProto, 'handleLogin')
      .mockResolvedValue({ success: true } as any);
    const registerSpy = jest
      .spyOn(authProto, 'handleRegister')
      .mockResolvedValue({ success: true } as any);
    const logoutSpy = jest
      .spyOn(authProto, 'handleLogout')
      .mockResolvedValue({ success: true } as any);
    const currentSpy = jest
      .spyOn(authProto, 'getCurrentUser')
      .mockResolvedValue({ success: true, user: { id: 'u' } } as any);
    const isAdminSpy = jest.spyOn(authProto, 'isAdmin').mockResolvedValue(true as any);
    const refreshSpy = jest.spyOn(authProto, 'refreshTokenIfNeeded').mockResolvedValue(true as any);

    await expect(sdk.login('a', 'b')).resolves.toEqual({ success: true });
    expect(loginSpy).toHaveBeenCalled();

    await expect(sdk.register('n', 'e', 'p')).resolves.toEqual({ success: true });
    expect(registerSpy).toHaveBeenCalled();

    await expect(sdk.logout()).resolves.toEqual({ success: true });
    expect(logoutSpy).toHaveBeenCalled();

    await expect(sdk.getCurrentUser()).resolves.toEqual({ success: true, user: { id: 'u' } });
    expect(currentSpy).toHaveBeenCalled();

    await expect(sdk.isAdmin()).resolves.toBe(true);
    expect(isAdminSpy).toHaveBeenCalled();

    await expect(sdk.refreshTokenIfNeeded()).resolves.toBe(true);
    expect(refreshSpy).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  test('setBaseURL updates all services', () => {
    const sdk = new Altus4SDK({} as any);
    const svcPrototypes = [
      (services as any).AuthService.prototype,
      (services as any).ApiKeysService.prototype,
      (services as any).DatabaseService.prototype,
      (services as any).AnalyticsService.prototype,
      (services as any).ManagementService.prototype,
    ];

    const spies = svcPrototypes.map(p => jest.spyOn(p, 'setBaseURL').mockImplementation(() => {}));

    sdk.setBaseURL('https://api.test');

    for (const s of spies) {
      expect(s).toHaveBeenCalledWith('https://api.test');
    }

    jest.restoreAllMocks();
  });

  test('isAuthenticated, setToken, clearToken, getBaseURL, testConnection delegate correctly', async () => {
    const sdk = new Altus4SDK({} as any);

    const authProto = (services as any).AuthService.prototype;
    const mgmtProto = (services as any).ManagementService.prototype;

    jest.spyOn(authProto, 'isAuthenticated').mockReturnValue(true as any);
    const setTokenSpy = jest.spyOn(authProto, 'setToken').mockImplementation(() => {});
    const clearTokenSpy = jest.spyOn(authProto, 'clearToken').mockImplementation(() => {});
    jest.spyOn(authProto, 'getBaseURL').mockReturnValue('https://base.test' as any);
    jest.spyOn(mgmtProto, 'testConnection').mockResolvedValue({ ok: true } as any);

    expect(sdk.isAuthenticated()).toBe(true);
    sdk.setToken('token123', 3600);
    expect(setTokenSpy).toHaveBeenCalledWith('token123', 3600);
    sdk.clearToken();
    expect(clearTokenSpy).toHaveBeenCalled();

    expect(sdk.getBaseURL()).toBe('https://base.test');
    await expect(sdk.testConnection()).resolves.toEqual({ ok: true });

    jest.restoreAllMocks();
  });

  test('createAltus4SDK factory and default export instance exist', () => {
    const { createAltus4SDK, altus4 } = require('./index');
    const sdk = createAltus4SDK({ baseURL: 'https://example.com' });
    expect(sdk).toBeInstanceOf(Altus4SDK);
    expect(altus4).toBeInstanceOf(Altus4SDK);
  });
});
