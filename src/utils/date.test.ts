import { addDays, formatYYYYMMDD, parseYYYYMMDD, startOfDayUTC, toISOStringUTC } from './date';

describe('utils/date', () => {
  test('toISOStringUTC returns ISO string', () => {
    const d = new Date(Date.UTC(2024, 0, 2, 3, 4, 5));
    expect(toISOStringUTC(d)).toBe('2024-01-02T03:04:05.000Z');
  });

  test('formatYYYYMMDD formats correctly', () => {
    const d = new Date(Date.UTC(2025, 11, 31));
    expect(formatYYYYMMDD(d)).toBe('2025-12-31');
  });

  test('parseYYYYMMDD parses valid strings and rejects invalid', () => {
    const s = '2024-02-29';
    const dt = parseYYYYMMDD(s);
    expect(dt).toBeInstanceOf(Date);
    expect(formatYYYYMMDD(dt!)).toBe(s);

    expect(parseYYYYMMDD('not-a-date')).toBeNull();
    expect(parseYYYYMMDD('2024-13-01')).toBeNull();
  });

  test('addDays and startOfDayUTC behavior', () => {
    const base = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
    const plusTwo = addDays(base, 2);
    expect(formatYYYYMMDD(plusTwo)).toBe('2024-01-03');

    const sod = startOfDayUTC(base);
    expect(sod.getUTCHours()).toBe(0);
    expect(sod.getUTCMinutes()).toBe(0);
  });
});
