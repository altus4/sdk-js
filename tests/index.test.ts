/**
 * Basic SDK tests
 */

import { Altus4SDK } from '../src';

describe('Altus4SDK', () => {
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
    
    sdk.setToken('test-token', 3600);
    expect(sdk.isAuthenticated()).toBe(true);
    
    sdk.clearToken();
    expect(sdk.isAuthenticated()).toBe(false);
  });
});