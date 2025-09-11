import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const svc = new AnalyticsService({ baseURL: 'https://api.test' } as any);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getDashboardAnalytics posts to /analytics/dashboard with body', async () => {
    const spy = jest
      .spyOn(AnalyticsService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: { totalSearches: 123 } });
    const req = { period: 'month' } as any;
    const res = await svc.getDashboardAnalytics(req);
    expect(spy).toHaveBeenCalledWith(
      '/analytics/dashboard',
      expect.objectContaining({ method: 'POST', data: req })
    );
    expect(res.success).toBe(true);
  });

  test('getTrends sends GET with params', async () => {
    const spy = jest
      .spyOn(AnalyticsService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: [] });
    const params = { period: 'week' } as any;
    await svc.getTrends(params);
    expect(spy).toHaveBeenCalledWith(
      '/analytics/trends',
      expect.objectContaining({ method: 'GET', params })
    );
  });

  test('getInsights forwards params', async () => {
    const spy = jest
      .spyOn(AnalyticsService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: [] });
    const params = { type: 'ai' } as any;
    await svc.getInsights(params);
    expect(spy).toHaveBeenCalledWith(
      '/analytics/insights',
      expect.objectContaining({ method: 'GET', params })
    );
  });

  test('getPerformanceMetrics forwards params', async () => {
    const spy = jest
      .spyOn(AnalyticsService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: {} });
    const params = { granularity: 'hour' } as any;
    await svc.getPerformanceMetrics(params);
    expect(spy).toHaveBeenCalledWith(
      '/analytics/performance',
      expect.objectContaining({ method: 'GET', params })
    );
  });

  test('getSearchHistory sends GET with optional query', async () => {
    const spy = jest
      .spyOn(AnalyticsService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: [] });
    await svc.getSearchHistory();
    expect(spy).toHaveBeenCalledWith(
      '/analytics/history',
      expect.objectContaining({ method: 'GET', params: undefined })
    );

    const q = { limit: 10 } as any;
    await svc.getSearchHistory(q);
    expect(spy).toHaveBeenCalledWith(
      '/analytics/history',
      expect.objectContaining({ method: 'GET', params: q })
    );
  });

  test('getUsageStats defaults to week and forwards period', async () => {
    const spy = jest
      .spyOn(AnalyticsService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: {} });
    await svc.getUsageStats();
    expect(spy).toHaveBeenCalledWith(
      '/analytics/usage',
      expect.objectContaining({ method: 'GET', params: { period: 'week' } })
    );

    await svc.getUsageStats('month');
    expect(spy).toHaveBeenCalledWith(
      '/analytics/usage',
      expect.objectContaining({ method: 'GET', params: { period: 'month' } })
    );
  });
});
