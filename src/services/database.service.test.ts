import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  const svc = new DatabaseService({ baseURL: 'https://api.test' } as any);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('addDatabaseConnection posts to /databases with body', async () => {
    const spy = jest
      .spyOn(DatabaseService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: { id: 'db1' } });
    const payload = { name: 'my-db' } as any;
    const res = await svc.addDatabaseConnection(payload);
    expect(spy).toHaveBeenCalledWith(
      '/databases',
      expect.objectContaining({ method: 'POST', data: payload })
    );
    expect(res.success).toBe(true);
  });

  test('listDatabaseConnections calls /databases', async () => {
    const spy = jest
      .spyOn(DatabaseService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: [] });
    await svc.listDatabaseConnections();
    expect(spy).toHaveBeenCalledWith('/databases');
  });

  test('updateDatabaseConnection puts to /databases/:id with updates', async () => {
    const spy = jest
      .spyOn(DatabaseService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: { id: 'db1' } });
    const updates = { host: 'localhost' } as any;
    await svc.updateDatabaseConnection('db1', updates);
    expect(spy).toHaveBeenCalledWith(
      '/databases/db1',
      expect.objectContaining({ method: 'PUT', data: updates })
    );
  });

  test('removeDatabaseConnection deletes /databases/:id', async () => {
    const spy = jest
      .spyOn(DatabaseService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: undefined });
    await svc.removeDatabaseConnection('db1');
    expect(spy).toHaveBeenCalledWith(
      '/databases/db1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  test('testDatabaseConnection posts to /databases/:id/test', async () => {
    const spy = jest
      .spyOn(DatabaseService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: { ok: true } });
    await svc.testDatabaseConnection('db1');
    expect(spy).toHaveBeenCalledWith(
      '/databases/db1/test',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('getDatabaseSchema calls /databases/:id/schema', async () => {
    const spy = jest
      .spyOn(DatabaseService.prototype as any, 'request')
      .mockResolvedValue({ success: true, data: { tables: [] } });
    await svc.getDatabaseSchema('db1');
    expect(spy).toHaveBeenCalledWith('/databases/db1/schema');
  });
});
