// Shared helper utilities for routes

// Valid time range values
export const VALID_TIME_RANGES = ['1d', '7d', '30d', '90d'] as const;
export type TimeRange = typeof VALID_TIME_RANGES[number];

export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return `${diff} secs ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function formatEthValue(wei: string | number): string {
  const value = typeof wei === 'string' ? BigInt(wei) : BigInt(wei);
  const eth = Number(value) / 1e18;
  return eth.toFixed(5);
}

/**
 * Get the time grouping function based on the time range.
 * - 1d, 7d: hourly grouping (toStartOfHour)
 * - 30d, 90d: daily grouping (toStartOfDay)
 */
export function getTimeGrouping(timeRange: string): string {
  switch (timeRange) {
    case '1d':
      return 'toStartOfHour';
    case '7d':
    case '30d':
    case '90d':
      return 'toStartOfDay';
    default:
      return 'toStartOfHour';
  }
}

export function getTimeRangeFilter(timeRange: string): string {
  const range = timeRange || '1d';

  if (!VALID_TIME_RANGES.includes(range as TimeRange)) {
    throw new Error(`Invalid timeRange. Must be one of: ${VALID_TIME_RANGES.join(', ')}`);
  }

  switch (range) {
    case '1d':
      return `e.block_timestamp >= now() - INTERVAL 1 DAY`;
    case '7d':
      return `e.block_timestamp >= now() - INTERVAL 7 DAY`;
    case '30d':
      return `e.block_timestamp >= now() - INTERVAL 30 DAY`;
    case '90d':
      return `e.block_timestamp >= now() - INTERVAL 90 DAY`;
    default:
      return `e.block_timestamp >= now() - INTERVAL 1 DAY`;
  }
}

export function getTimestampTimeRangeFilter(timeRange: string): string {
  const range = timeRange || '1d';

  if (!VALID_TIME_RANGES.includes(range as TimeRange)) {
    throw new Error(`Invalid timeRange. Must be one of: ${VALID_TIME_RANGES.join(', ')}`);
  }

  switch (range) {
    case '1d':
      return `timestamp >= now() - INTERVAL 1 DAY`;
    case '7d':
      return `timestamp >= now() - INTERVAL 7 DAY`;
    case '30d':
      return `timestamp >= now() - INTERVAL 30 DAY`;
    case '90d':
      return `timestamp >= now() - INTERVAL 90 DAY`;
    default:
      return `timestamp >= now() - INTERVAL 1 DAY`;
  }
}

