import * as utils from './index';

describe('utils index exports', () => {
  test('exports expected utility functions', () => {
    // Ensure module loads and contains known helpers
    expect(utils).toBeDefined();
    expect(
      typeof (utils as any).formatDate === 'function' ||
        typeof (utils as any).toISOStringUTC === 'function'
    ).toBe(true);
  });
});
