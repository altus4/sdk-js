import * as client from './index';

describe('client index exports', () => {
  test('exports BaseClient and ClientConfig type', () => {
    expect(client.BaseClient).toBeDefined();
    // ClientConfig is a type-only export; ensure module loads without error
    expect(typeof client).toBe('object');
  });
});
