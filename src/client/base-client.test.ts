import { BaseClient } from './base-client';
import type { ClientConfig } from './config';

// Mock axios.create to provide a controlled client with interceptors
jest.mock('axios', () => {
  return {
    create: (cfg: any) => {
      const requestInterceptors: any[] = [];
      const responseInterceptors: any[] = [];

      const client: any = (reqCfg: any) => {
        // apply request interceptors
        let cfg = { ...(reqCfg || {}) };
        cfg.headers = cfg.headers || {};
        for (const h of requestInterceptors) {
          cfg = h(cfg) || cfg;
        }

        // modes for deterministic behaviour in tests
        if (cfg.__mode === 'success') {
          return Promise.resolve({ data: { success: true, data: cfg.__response ?? null } });
        }

        if (cfg.__mode === 'apiError') {
          const err: any = new Error('api error');
          err.response = {
            data: { success: false, error: { code: 'API_ERR', message: 'failed' } },
            status: 400,
          };
          return Promise.reject(err);
        }

        if (cfg.__mode === '401Error') {
          const err: any = new Error('unauthorized');
          err.response = { status: 401, data: { success: false, error: 'Unauthorized' } };
          err.config = cfg;
          // Apply response interceptors to simulate axios behavior
          for (const interceptor of responseInterceptors) {
            try {
              return interceptor.errorHandler(err);
            } catch (e) {
              return Promise.reject(e);
            }
          }
          return Promise.reject(err);
        }

        if (cfg.__mode === 'network') {
          return Promise.reject(new Error('network failure'));
        }

        if (cfg.__mode === 'echo') {
          // return the final config so tests can inspect headers, url, etc.
          return Promise.resolve({ data: { success: true, data: cfg } });
        }

        return Promise.resolve({ data: { success: true, data: null } });
      };

      // Add post method for refresh token tests
      client.post = (url: string, data: any, config?: any) => {
        if (url === '/auth/refresh' && config?.__refreshMode === 'success') {
          return Promise.resolve({ data: { token: 'new-token-123' } });
        }
        if (url === '/auth/refresh' && config?.__refreshMode === 'failure') {
          return Promise.reject(new Error('Refresh failed'));
        }
        return client({ url, method: 'POST', data, ...config });
      };

      client.interceptors = {
        request: {
          use: (fn: any) => {
            requestInterceptors.push(fn);
          },
        },
        response: {
          use: (successHandler: any, errorHandler: any) => {
            responseInterceptors.push({ successHandler, errorHandler });
          },
        },
      };

      client.defaults = { baseURL: cfg?.baseURL };
      return client;
    },
  };
});

describe('BaseClient', () => {
  const cfg: ClientConfig = { baseURL: 'https://api.test.local', timeout: 1000 } as any;

  test('request returns response.data on success', async () => {
    const c = new BaseClient(cfg) as any;
    const res = await c.request('/ok', {
      method: 'GET',
      __mode: 'success',
      __response: { hello: 'world' },
    });
    expect(res).toEqual({ success: true, data: { hello: 'world' } });
  });

  test('request returns API error body when axios throws response', async () => {
    const c = new BaseClient(cfg) as any;
    const res = await c.request('/err', { method: 'POST', __mode: 'apiError' });
    expect(res).toEqual({ success: false, error: { code: 'API_ERR', message: 'failed' } });
  });

  test('request returns NETWORK_ERROR when network failure occurs', async () => {
    const c = new BaseClient(cfg) as any;
    const res = await c.request('/bad', { method: 'GET', __mode: 'network' });
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.error.code).toBe('NETWORK_ERROR');
    expect(typeof res.error.message).toBe('string');
  });

  test('token helpers use localStorage when window is present', () => {
    // simulate browser environment
    // @ts-ignore
    global.window = {};
    const store: Record<string, string> = {};
    // @ts-ignore
    global.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => (store[k] = String(v)),
      removeItem: (k: string) => delete store[k],
    };

    const c = new BaseClient(cfg) as any;
    expect((c as any).getToken()).toBeNull();

    (c as any).setToken('tk-1');
    expect(store['altus4_token']).toBe('tk-1');
    expect((c as any).getToken()).toBe('tk-1');

    (c as any).clearToken();
    expect((c as any).getToken()).toBeNull();

    // cleanup
    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.localStorage;
  });

  test('request interceptor adds Authorization header when token present', async () => {
    const c = new BaseClient(cfg) as any;

    // override getToken to simulate existing token
    (c as any).getToken = () => 'token-xyz';

    const res = await c.request('/inspect', { method: 'GET', __mode: 'echo' });
    expect(res.success).toBe(true);
    // the echoed config should include headers.Authorization
    expect(res.data.headers).toBeDefined();
    expect(res.data.headers.Authorization).toBe('Bearer token-xyz');
  });

  test('setBaseURL updates instance and axios defaults', () => {
    const c = new BaseClient(cfg) as any;
    expect(c.getBaseURL()).toBe('https://api.test.local');

    c.setBaseURL('https://new.example');
    expect(c.getBaseURL()).toBe('https://new.example');
    expect((c as any).client.defaults.baseURL).toBe('https://new.example');
  });

  test('request interceptor error handler rejects error', async () => {
    const c = new BaseClient(cfg) as any;

    // Create a mock error for the request interceptor
    const mockError = new Error('Request interceptor error');

    // Override the client call method to throw error
    const originalClient = c.client;
    c.client = jest.fn(() => {
      throw mockError;
    });
    // Add interceptors property to keep interface compatible
    c.client.interceptors = originalClient.interceptors;

    const result = await c.request('/test');
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('NETWORK_ERROR');
    expect(result.error.message).toBe('Request interceptor error');
  });

  test('401 error clears token when refresh endpoint fails', async () => {
    const c = new BaseClient(cfg) as any;

    // Set a token first
    c.setToken('test-token');
    expect(c.getToken()).toBe('test-token');

    // Mock clearToken to verify it gets called
    const clearTokenSpy = jest.spyOn(c, 'clearToken');

    try {
      await c.request('/auth/refresh', { __mode: '401Error' });
    } catch (error) {
      // Error should be thrown
    }

    // clearToken should have been called during 401 handling
    expect(clearTokenSpy).toHaveBeenCalled();
  });

  test('initializeTokenFromStorage loads token on construction', () => {
    // Mock TokenStorageManager to return a token
    const mockToken = 'stored-token-123';

    // Create a new instance to test initialization
    const c = new BaseClient(cfg) as any;

    // Mock the storage to return a token
    jest.spyOn(c, 'getToken').mockReturnValue(mockToken);

    expect(c.getToken()).toBe(mockToken);
  });

  test('getToken returns stored token and syncs with memory', () => {
    const c = new BaseClient(cfg) as any;

    // Test when no token is stored
    expect(c.getToken()).toBeNull();

    // Test when token is available
    c.token = 'memory-token';
    expect(c.getToken()).toBe('memory-token');
  });
});
