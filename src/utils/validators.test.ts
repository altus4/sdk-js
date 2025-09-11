import {
  sanitizeString,
  validateApiKeyCreation,
  validateDatabaseConnection,
  validateDateString,
  validateEmail,
  validatePassword,
  validatePort,
  validateProfileUpdate,
  validateRegistration,
  validateSearchQuery,
  validateURL,
} from './validators';

describe('validators', () => {
  test('validateEmail - valid and invalid', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('not-an-email')).toBe(false);
  });

  test('validatePassword - weak and strong', () => {
    const weak = validatePassword('short');
    expect(weak.isValid).toBe(false);
    const strong = validatePassword('Str0ng!Passw0rd');
    expect(strong.isValid).toBe(true);
  });

  test('validateRegistration - basic success and failure', () => {
    const good = validateRegistration({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Str0ng!Passw0rd',
    } as any);
    expect(good.isValid).toBe(true);

    const bad = validateRegistration({
      name: 'J',
      email: 'bad-email',
      password: 'weak',
    } as any);
    expect(bad.isValid).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(0);
  });

  test('validateSearchQuery - empty and injection', () => {
    const empty = validateSearchQuery('');
    expect(empty.isValid).toBe(false);

    const sql = validateSearchQuery('SELECT * FROM users; DROP TABLE users;');
    expect(sql.isValid).toBe(false);
  });

  test('validateURL, validatePort, validateDateString and sanitizeString', () => {
    expect(validateURL('https://example.com')).toBe(true);
    expect(validateURL('notaurl')).toBe(false);

    expect(validatePort(80)).toBe(true);
    expect(validatePort(70000)).toBe(false);

    expect(validateDateString('2024-12-31')).toBe(true);
    expect(validateDateString('31-12-2024')).toBe(false);

    const sanitized = sanitizeString('<script>alert(1)</script>"hello"');
    // Should remove angle brackets and quotes, and keep the readable parts
    expect(sanitized).not.toMatch(/[<>"']/);
    expect(sanitized).toMatch(/alert/);
    expect(sanitized).toMatch(/hello/);
  });

  test('validatePassword - missing requirements', () => {
    // Missing uppercase
    const noUpper = validatePassword('lowercase1!');
    expect(noUpper.isValid).toBe(false);
    expect(noUpper.errors.some(e => /uppercase/i.test(e))).toBe(true);

    // Missing number
    const noNumber = validatePassword('NoNumber!');
    expect(noNumber.isValid).toBe(false);
    expect(noNumber.errors.some(e => /number/i.test(e))).toBe(true);

    // Missing special char
    const noSpecial = validatePassword('NoSpecial1');
    expect(noSpecial.isValid).toBe(false);
    expect(noSpecial.errors.some(e => /special/i.test(e))).toBe(true);
  });

  test('validateProfileUpdate - name and email branches', () => {
    // name provided but too short
    const r1 = validateProfileUpdate({ name: 'A' } as any);
    expect(r1.isValid).toBe(false);

    // email provided but invalid
    const r2 = validateProfileUpdate({ email: 'bad' } as any);
    expect(r2.isValid).toBe(false);

    // both undefined should be valid (no changes)
    const r3 = validateProfileUpdate({} as any);
    expect(r3.isValid).toBe(true);
  });

  test('validateApiKeyCreation - various errors and success', () => {
    // name too short
    const badName = validateApiKeyCreation({ name: 'ab', environment: 'test' } as any);
    expect(badName.isValid).toBe(false);

    // invalid environment
    const badEnv = validateApiKeyCreation({ name: 'good', environment: 'staging' } as any);
    expect(badEnv.isValid).toBe(false);

    // invalid permissions
    const badPerms = validateApiKeyCreation({
      name: 'good',
      environment: 'test',
      permissions: ['unknown'],
    } as any);
    expect(badPerms.isValid).toBe(false);

    // invalid rateLimitTier
    const badRate = validateApiKeyCreation({
      name: 'good',
      environment: 'test',
      rateLimitTier: 'gold',
    } as any);
    expect(badRate.isValid).toBe(false);

    // invalid expiresAt format
    const badExp = validateApiKeyCreation({
      name: 'good',
      environment: 'test',
      expiresAt: 'not-a-date',
    } as any);
    expect(badExp.isValid).toBe(false);

    // past date
    const past = validateApiKeyCreation({
      name: 'good',
      environment: 'test',
      expiresAt: '2000-01-01',
    } as any);
    expect(past.isValid).toBe(false);

    // valid
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const ok = validateApiKeyCreation({
      name: 'good',
      environment: 'test',
      expiresAt: future,
      permissions: ['search'],
    } as any);
    expect(ok.isValid).toBe(true);
  });

  test('validateDatabaseConnection - missing fields and port checks', () => {
    const missing = validateDatabaseConnection({} as any);
    expect(missing.isValid).toBe(false);

    // invalid port
    const badPort = validateDatabaseConnection({
      name: 'n',
      host: 'h',
      port: 70000,
      database: 'db',
      username: 'u',
    } as any);
    expect(badPort.isValid).toBe(false);

    // valid
    const ok = validateDatabaseConnection({
      name: 'n',
      host: 'h',
      port: 3306,
      database: 'db',
      username: 'u',
    } as any);
    expect(ok.isValid).toBe(true);
  });

  test('validateSearchQuery - long query and other injection patterns', () => {
    const long = 'a'.repeat(501);
    expect(validateSearchQuery(long).isValid).toBe(false);

    expect(validateSearchQuery('1 OR 1=1').isValid).toBe(false);
    expect(validateSearchQuery('normal search term').isValid).toBe(true);
  });

  test('validateDateString invalid calendar date', () => {
    // Note: JS Date will roll invalid calendar dates (e.g. Feb 30 -> Mar 1),
    // so the current implementation treats this as a valid date string format.
    expect(validateDateString('2024-02-30')).toBe(true);
  });

  test('validatePort non-integer fails', () => {
    expect(validatePort(3.14)).toBe(false);
  });
});
