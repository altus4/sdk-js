import * as services from './index';

describe('services index exports', () => {
  test('exports service classes', () => {
    expect(services.AuthService).toBeDefined();
    expect(services.ApiKeysService).toBeDefined();
    expect(services.DatabaseService).toBeDefined();
    expect(services.AnalyticsService).toBeDefined();
    expect(services.ManagementService).toBeDefined();
  });
});
