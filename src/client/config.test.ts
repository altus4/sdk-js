import { DEFAULT_CONFIG } from './config';

describe('client/config', () => {
  test('DEFAULT_CONFIG has expected properties and types', () => {
    expect(DEFAULT_CONFIG).toBeDefined();
    expect(typeof DEFAULT_CONFIG.baseURL).toBe('string');
    expect(DEFAULT_CONFIG.baseURL).toBe('http://localhost:3000/api/v1');
    expect(typeof DEFAULT_CONFIG.timeout).toBe('number');
    expect(DEFAULT_CONFIG.timeout).toBe(30000);
    expect(typeof DEFAULT_CONFIG.headers).toBe('object');
    expect(DEFAULT_CONFIG.debug).toBe(false);
  });

  test('DEFAULT_CONFIG.headers is an object and can be extended', () => {
    const headers = { ...DEFAULT_CONFIG.headers, Authorization: 'Bearer x' };
    expect(headers.Authorization).toBe('Bearer x');
    // ensure original DEFAULT_CONFIG.headers wasn't mutated
    expect((DEFAULT_CONFIG.headers as any).Authorization).toBeUndefined();
  });
});
