import { Request, Response, NextFunction } from 'express';

/**
 * Cache entry with metadata for stale-while-revalidate pattern
 */
interface CacheEntry {
  data: unknown;
  createdAt: number;
  ttl: number;
}

interface CacheStore {
  [key: string]: CacheEntry;
}

// Track keys currently being refreshed to avoid duplicate refreshes
const refreshingKeys = new Set<string>();

// In-memory cache store
const cacheStore: CacheStore = {};

/**
 * TTL configuration per time range (in milliseconds)
 * Longer time ranges change less frequently, so use longer TTLs
 */
const TTL_BY_TIME_RANGE: Record<string, number> = {
  '1d': 5 * 60 * 1000,    // 5 minutes
  '7d': 10 * 60 * 1000,   // 10 minutes
  '30d': 30 * 60 * 1000,  // 30 minutes
  '90d': 60 * 60 * 1000,  // 60 minutes
};

// Default TTL when timeRange is not specified or unknown
export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Extract timeRange from cache key (e.g., "/api/gross-mev?timeRange=30d" -> "30d")
 */
export function getTimeRangeFromKey(key: string): string | null {
  const match = key.match(/timeRange=(\w+)/);
  return match ? match[1] : null;
}

/**
 * Get TTL for a cache key based on the timeRange parameter
 */
export function getTTLForKey(key: string): number {
  const timeRange = getTimeRangeFromKey(key);
  if (timeRange && TTL_BY_TIME_RANGE[timeRange]) {
    return TTL_BY_TIME_RANGE[timeRange];
  }
  return DEFAULT_CACHE_TTL_MS;
}

/**
 * Generate a cache key from request path and query parameters
 */
function generateCacheKey(req: Request): string {
  const path = req.path;
  const queryString = Object.keys(req.query)
    .sort()
    .map(key => `${key}=${req.query[key]}`)
    .join('&');
  return queryString ? `${path}?${queryString}` : path;
}

/**
 * Check if a cache entry is fresh (within TTL)
 */
function isFresh(entry: CacheEntry): boolean {
  return Date.now() < entry.createdAt + entry.ttl;
}

/**
 * Check if a cache entry is stale (past TTL but data available)
 */
function isStale(entry: CacheEntry): boolean {
  return !isFresh(entry);
}

/**
 * Type for fetch function used in background refresh
 */
type FetchFunction = () => Promise<unknown>;

/**
 * Store of fetch functions for background refresh
 * Maps cache key to the function that fetches fresh data
 */
const fetchFunctions: Map<string, FetchFunction> = new Map();

/**
 * Register a fetch function for a cache key
 * This allows background refresh to know how to fetch fresh data
 */
export function registerFetchFunction(key: string, fetchFn: FetchFunction): void {
  fetchFunctions.set(key, fetchFn);
}

/**
 * Non-blocking background refresh for stale cache entries
 * Returns immediately and refreshes cache in background
 */
function triggerBackgroundRefresh(key: string, fetchFn?: FetchFunction): void {
  // Skip if already refreshing this key
  if (refreshingKeys.has(key)) {
    return;
  }

  const fn = fetchFn || fetchFunctions.get(key);
  if (!fn) {
    console.log(`[CACHE REFRESH SKIP] No fetch function for ${key}`);
    return;
  }

  refreshingKeys.add(key);

  // Use setImmediate for non-blocking execution
  setImmediate(async () => {
    try {
      console.log(`[CACHE REFRESH START] ${key}`);
      const freshData = await fn();
      const ttl = getTTLForKey(key);

      cacheStore[key] = {
        data: freshData,
        createdAt: Date.now(),
        ttl,
      };

      console.log(`[CACHE REFRESH DONE] ${key} (TTL: ${Math.round(ttl / 1000)}s)`);
    } catch (error) {
      console.error(`[CACHE REFRESH ERROR] ${key}`, error);
    } finally {
      refreshingKeys.delete(key);
    }
  });
}

/**
 * Manually set a cache entry (useful for pre-warming)
 */
export function setCacheEntry(key: string, data: unknown, ttl?: number): void {
  const entryTtl = ttl ?? getTTLForKey(key);
  cacheStore[key] = {
    data,
    createdAt: Date.now(),
    ttl: entryTtl,
  };
  console.log(`[CACHE SET] ${key} (TTL: ${Math.round(entryTtl / 1000)}s)`);
}

/**
 * Get a cache entry if it exists
 */
export function getCacheEntry(key: string): CacheEntry | undefined {
  return cacheStore[key];
}

/**
 * Factory to create a caching middleware with stale-while-revalidate support
 */
export function createCacheMiddleware() {
  return function cacheMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cachedEntry = cacheStore[cacheKey];

    if (cachedEntry) {
      if (isFresh(cachedEntry)) {
        // Case 1: Fresh cache - return immediately
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cachedEntry.data);
        return;
      } else if (isStale(cachedEntry)) {
        // Case 2: Stale cache - return stale data immediately, trigger background refresh
        console.log(`[CACHE STALE] ${cacheKey} - returning stale data, refreshing in background`);

        // We'll register the fetch function when the response comes through
        // For now, trigger refresh if we have a registered fetch function
        triggerBackgroundRefresh(cacheKey);

        res.json(cachedEntry.data);
        return;
      }
    }

    // Case 3: No cache (cold start) - fetch from database
    console.log(`[CACHE MISS] ${cacheKey}`);

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to intercept response
    res.json = function (body: unknown) {
      // Only cache successful responses (status 200)
      if (res.statusCode === 200) {
        const ttl = getTTLForKey(cacheKey);
        cacheStore[cacheKey] = {
          data: body,
          createdAt: Date.now(),
          ttl,
        };

        console.log(`[CACHE SET] ${cacheKey} (TTL: ${Math.round(ttl / 1000)}s)`);
      }

      // Call original json method
      return originalJson(body);
    };

    next();
  };
}

/**
 * Clean up expired cache entries
 * With stale-while-revalidate, we can keep stale entries longer
 * Only remove entries that are significantly past their TTL (2x TTL)
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const key in cacheStore) {
    const entry = cacheStore[key];
    const maxAge = entry.createdAt + (entry.ttl * 2); // Keep stale data for up to 2x TTL

    if (now > maxAge) {
      delete cacheStore[key];
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[CACHE CLEANUP] Removed ${cleanedCount} expired cache entries`);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{
    key: string;
    createdAt: number;
    ttl: number;
    isFresh: boolean;
    isStale: boolean;
  }>;
} {
  const entries = Object.keys(cacheStore).map(key => {
    const entry = cacheStore[key];
    return {
      key,
      createdAt: entry.createdAt,
      ttl: entry.ttl,
      isFresh: isFresh(entry),
      isStale: isStale(entry),
    };
  });

  return {
    size: entries.length,
    entries,
  };
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  const count = Object.keys(cacheStore).length;
  Object.keys(cacheStore).forEach(key => delete cacheStore[key]);
  console.log(`[CACHE CLEARED] Removed ${count} cache entries`);
}

/**
 * Get all cache keys
 */
export function getCacheKeys(): string[] {
  return Object.keys(cacheStore);
}

// Export for testing
export { cacheStore, refreshingKeys };
