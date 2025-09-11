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
    .map(s => (s.length > 0 ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s))
    .join(' ');
}

/**
 * Format a number with grouped thousands
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export default {
  humanizeBytes,
  truncate,
  titleCase,
  formatNumber,
};
