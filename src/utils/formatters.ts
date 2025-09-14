/**
 * Small, commonly used formatting helpers.
 */

/**
 * Convert bytes to a human readable string (KB, MB, GB)
 */
export function humanizeBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(2)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

/**
 * Truncate a string and append ellipsis if longer than max
 */
export function truncate(input: string, max = 50): string {
  if (!input) {
    return input;
  }
  if (input.length <= max) {
    return input;
  }
  return `${input.slice(0, max - 1)}…`;
}

/**
 * Title-case a string (simple implementation)
 */
export function titleCase(input: string): string {
  if (!input) {
    return input;
  }
  return input
    .split(/\s+/)
    .map(s => (s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s))
    .join(' ');
}

/**
 * Format a number with grouped thousands
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format response time in ms to human readable (e.g., 250ms, 1.50s)
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Compact number formatting (e.g., 1.5K, 2.5M)
 */
export function formatCompactNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return `${n}`;
}

/**
 * Relative time from a Date (e.g., 1 hour ago)
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const abs = Math.abs(diffMs);
  const minutes = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);
  const suffix = diffMs >= 0 ? 'ago' : 'from now';
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ${suffix}`;
  }
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ${suffix}`;
  }
  return `${days} day${days === 1 ? '' : 's'} ${suffix}`;
}

import type { RateLimitTier } from '../types/common';
import type { RateLimitInfo } from '../types/api-keys';

/**
 * Get display info for a given rate limit tier
 */
export function getRateLimitInfo(tier: RateLimitTier): RateLimitInfo {
  switch (tier) {
    case 'free':
      return { limit: 1000, name: 'Free', description: '1,000 requests per hour' };
    case 'pro':
      return { limit: 10000, name: 'Pro', description: '10,000 requests per hour' };
    case 'enterprise':
      return { limit: 100000, name: 'Enterprise', description: '100,000 requests per hour' };
    default:
      return { limit: 0, name: 'Unknown', description: 'Unknown rate limit' };
  }
}

export default {
  humanizeBytes,
  truncate,
  titleCase,
  formatNumber,
  formatCompactNumber,
  formatResponseTime,
  formatRelativeTime,
  getRateLimitInfo,
};
