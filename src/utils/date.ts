/**
 * Small date utilities used by the SDK.
 *
 * All helpers operate in UTC to keep behavior deterministic in tests and
 * avoid local timezone flakiness.
 */

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Format a Date as ISO string (UTC)
 */
export function toISOStringUTC(date: Date): string {
  return date.toISOString();
}

/**
 * Format a Date as YYYY-MM-DD (UTC)
 */
export function formatYYYYMMDD(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date (UTC) or return null for invalid input
 */
export function parseYYYYMMDD(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    return null;
  }

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  if (month < 1 || month > 12) {
    return null;
  }
  if (day < 1 || day > 31) {
    return null;
  }

  // Construct a UTC date to avoid timezone shifts
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt;
}

/**
 * Add (or subtract) days to a date returning a new Date (preserves time-of-day)
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Return start of day in UTC for a given date (time set to 00:00:00 UTC)
 */
export function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

import type { Period } from '../types/common';

/**
 * Format a Date for query parameters as YYYY-MM-DD (UTC)
 */
export function formatDateForQuery(date: Date): string {
  return formatYYYYMMDD(date);
}

/**
 * Get a date range for a given analytics period.
 * Returns strings in YYYY-MM-DD (UTC).
 */
export function getDateRangeForPeriod(
  period: Period,
  now: Date = new Date()
): {
  startDate: string;
  endDate: string;
} {
  const end = startOfDayUTC(now);
  let start: Date;
  switch (period) {
    case 'day':
      start = addDays(end, -1);
      break;
    case 'week':
      start = addDays(end, -7);
      break;
    case 'month':
      start = addDays(end, -30);
      break;
    case 'year':
      start = addDays(end, -365);
      break;
    default:
      start = addDays(end, -7);
  }
  return { startDate: formatYYYYMMDD(start), endDate: formatYYYYMMDD(end) };
}

export * from './date';
