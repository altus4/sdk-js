import { formatNumber, humanizeBytes, titleCase, truncate } from './formatters';

describe('utils/formatters', () => {
  test('humanizeBytes formats correctly', () => {
    expect(humanizeBytes(512)).toBe('512 B');
    expect(humanizeBytes(1024)).toBe('1.00 KB');
    expect(humanizeBytes(1024 * 1024)).toBe('1.00 MB');
  });

  test('truncate short and long strings', () => {
    expect(truncate('hello', 10)).toBe('hello');
    const long = 'a'.repeat(100);
    const truncated = truncate(long, 10);
    expect(truncated.length).toBeLessThan(11);
    expect(truncated.endsWith('…')).toBe(true);
  });

  test('titleCase capitalizes words', () => {
    expect(titleCase('hello world')).toBe('Hello World');
    expect(titleCase('MIXED case')).toBe('Mixed Case');
  });

  test('formatNumber groups thousands', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  test('humanizeBytes handles GB and boundaries', () => {
    // 1 GiB
    const gb = 1024 * 1024 * 1024;
    expect(humanizeBytes(gb)).toBe('1.00 GB');
    // below 1KB
    expect(humanizeBytes(0)).toBe('0 B');
  });

  test('truncate and titleCase handle empty input gracefully', () => {
    expect(truncate('', 10)).toBe('');
    expect(titleCase('')).toBe('');
  });
});
