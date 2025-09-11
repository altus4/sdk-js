import { ManagementService } from './management.service';

describe('ManagementService', () => {
  const svc = new ManagementService({ baseURL: 'https://api.test' } as any);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('testConnection calls /health', async () => {
    const spy = jest
      .spyOn(ManagementService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: { ok: true } });
    await svc.testConnection();
    expect(spy).toHaveBeenCalledWith('/health');
  });

  test('getSystemStatus calls /status', async () => {
    const spy = jest
      .spyOn(ManagementService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: { status: 'ok' } });
    await svc.getSystemStatus();
    expect(spy).toHaveBeenCalledWith('/status');
  });

  test('setup posts to /management/setup with data', async () => {
    const spy = jest
      .spyOn(ManagementService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: {} });
    const payload = { admin: true } as any;
    await svc.setup(payload);
    expect(spy).toHaveBeenCalledWith(
      '/management/setup',
      expect.objectContaining({ method: 'POST', data: payload })
    );
  });

  test('getMetrics calls /metrics', async () => {
    const spy = jest
      .spyOn(ManagementService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: {} });
    await svc.getMetrics();
    expect(spy).toHaveBeenCalledWith('/metrics');
  });
});
