/**
 * Central configuration constants
 * All hardcoded values and magic numbers should be defined here
 */

export const DEFAULTS = {
  TIME_RANGE: '24hours',
  CACHE_EXPIRE_MS: 5 * 60 * 1000,
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MIN_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },
  QUERY_LIMITS: {
    LATEST_TRANSACTIONS: 20,
    LATEST_BLOCKS: 20,
    EXPRESS_LANE_ROUNDS: 100,
    AUCTION_WIN_COUNT: 15,
    BIDS_PER_ROUND: 15,
  },
} as const;
