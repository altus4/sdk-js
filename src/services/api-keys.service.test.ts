import { ApiKeysService } from './api-keys.service';

describe('ApiKeysService', () => {
  const svc = new ApiKeysService({ baseURL: 'https://api.test' } as any);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('createApiKey posts to /keys with body', async () => {
    const spy = jest
      .spyOn(ApiKeysService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: { apiKey: { id: '1' }, secretKey: 's' } });
    const payload = { name: 'my-key' } as any;
    const res = await svc.createApiKey(payload);
    expect(spy).toHaveBeenCalledWith(
      '/keys',
      expect.objectContaining({ method: 'POST', data: payload })
    );
    expect(res.success).toBe(true);
  });

  test('listApiKeys calls GET /keys without options', async () => {
    const spy = jest
      .spyOn(ApiKeysService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: [] });
    await svc.listApiKeys();
    expect(spy).toHaveBeenCalledWith('/keys');
  });

  test('updateApiKey puts to /keys/:id with updates', async () => {
    const spy = jest
      .spyOn(ApiKeysService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: { id: 'k' } });
    const updates = { name: 'updated' } as any;
    await svc.updateApiKey('k', updates);
    expect(spy).toHaveBeenCalledWith(
      '/keys/k',
      expect.objectContaining({ method: 'PUT', data: updates })
    );
  });

  test('getApiKeyUsage calls /keys/:id/usage', async () => {
    const spy = jest
      .spyOn(ApiKeysService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: {} });
    await svc.getApiKeyUsage('k');
    expect(spy).toHaveBeenCalledWith('/keys/k/usage');
  });

  test('regenerateApiKey posts to /keys/:id/regenerate', async () => {
    const spy = jest
      .spyOn(ApiKeysService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: { secretKey: 'new' } });
    await svc.regenerateApiKey('k');
    expect(spy).toHaveBeenCalledWith(
      '/keys/k/regenerate',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('revokeApiKey deletes /keys/:id', async () => {
    const spy = jest
      .spyOn(ApiKeysService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: undefined });
    await svc.revokeApiKey('k');
    expect(spy).toHaveBeenCalledWith('/keys/k', expect.objectContaining({ method: 'DELETE' }));
  });
});
