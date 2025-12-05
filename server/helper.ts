// Shared helper utilities for routes
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

export function getTimeRangeFilter(timeRange: string): string {
  const validRanges = ['6hours', '12hours', '24hours', '3days', '7days', '14days', '30days'];
  const range = timeRange || '24hours';

  if (!validRanges.includes(range)) {
    throw new Error(`Invalid timeRange. Must be one of: ${validRanges.join(', ')}`);
  }

  switch (range) {
    case '6hours':
      return `e.block_timestamp >= now() - INTERVAL 6 HOUR`;
    case '12hours':
      return `e.block_timestamp >= now() - INTERVAL 12 HOUR`;
    case '24hours':
      return `e.block_timestamp >= now() - INTERVAL 24 HOUR`;
    case '3days':
      return `e.block_timestamp >= now() - INTERVAL 3 DAY`;
    case '7days':
      return `e.block_timestamp >= now() - INTERVAL 7 DAY`;
    case '14days':
      return `e.block_timestamp >= now() - INTERVAL 14 DAY`;
    case '30days':
      return `e.block_timestamp >= now() - INTERVAL 30 DAY`;
    default:
      return `e.block_timestamp >= now() - INTERVAL 24 HOUR`;
  }
}

export function getTimestampTimeRangeFilter(timeRange: string): string {
  const validRanges = ['6hours', '12hours', '24hours', '3days', '7days', '14days', '30days'];
  const range = timeRange || '24hours';

  if (!validRanges.includes(range)) {
    throw new Error(`Invalid timeRange. Must be one of: ${validRanges.join(', ')}`);
  }

  switch (range) {
    case '6hours':
      return `timestamp >= now() - INTERVAL 6 HOUR`;
    case '12hours':
      return `timestamp >= now() - INTERVAL 12 HOUR`;
    case '24hours':
      return `timestamp >= now() - INTERVAL 24 HOUR`;
    case '3days':
      return `timestamp >= now() - INTERVAL 3 DAY`;
    case '7days':
      return `timestamp >= now() - INTERVAL 7 DAY`;
    case '14days':
      return `timestamp >= now() - INTERVAL 14 DAY`;
    case '30days':
      return `timestamp >= now() - INTERVAL 30 DAY`;
    default:
      return `timestamp >= now() - INTERVAL 24 HOUR`;
  }
}

