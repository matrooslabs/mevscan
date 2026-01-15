import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Valid time range values
 */
export const TIME_RANGES = ['1d', '7d', '30d', '90d'] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

/**
 * Time range labels for UI display
 */
export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '1d': '24H',
  '7d': '1W',
  '30d': '30D',
  '90d': '90D',
};

const STORAGE_KEY = 'mevscan-time-range';
const DEFAULT_TIME_RANGE: TimeRange = '1d';

/**
 * Get the initial time range from URL params or localStorage
 */
function getInitialTimeRange(): TimeRange {
  // First check localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && TIME_RANGES.includes(stored as TimeRange)) {
      return stored as TimeRange;
    }
  }
  return DEFAULT_TIME_RANGE;
}

/**
 * Hook for managing global time range state.
 * Persists selection in URL params and localStorage.
 *
 * @returns [timeRange, setTimeRange] tuple
 */
export function useTimeRange(): [TimeRange, (range: TimeRange) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const timeRange = useMemo(() => {
    const urlRange = searchParams.get('range');
    if (urlRange && TIME_RANGES.includes(urlRange as TimeRange)) {
      return urlRange as TimeRange;
    }
    return getInitialTimeRange();
  }, [searchParams]);

  const setTimeRange = useCallback(
    (newRange: TimeRange) => {
      // Update URL params
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('range', newRange);
        return newParams;
      });

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newRange);
      }
    },
    [setSearchParams]
  );

  return [timeRange, setTimeRange];
}

/**
 * Format a Unix timestamp based on the selected time range.
 * - 1d, 7d: "HH:mm" format (e.g., "14:30")
 * - 30d, 90d: "MMM DD" format (e.g., "Jan 10")
 */
export function formatTimeForRange(timestamp: number, timeRange: TimeRange): string {
  const date = new Date(timestamp * 1000);

  if (isNaN(date.getTime())) {
    return '';
  }

  if (timeRange === '1d' || timeRange === '7d') {
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  }

  // 30d, 90d - show date
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  return `${month} ${day}`;
}
