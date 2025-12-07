import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  expiresAt: number;
  timestamp: number;
}

interface CacheStore {
  [key: string]: CacheEntry;
}

// In-memory cache store
const cacheStore: CacheStore = {};

// Default cache expiry (ms)
export const DEFAULT_CACHE_EXPIRE_MS = 5 * 60 * 1000;

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
 * Determine whether a cache entry is expired
 */
function isExpired(entry: CacheEntry, now: number): boolean {
  return entry.expiresAt <= now;
}

/**
 * Factory to create a caching middleware with configurable expiry
 */
export function createCacheMiddleware(expireDurationMs = DEFAULT_CACHE_EXPIRE_MS) {
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
    const now = Date.now();

    // Check if we have cached data
    const cachedEntry = cacheStore[cacheKey];

    if (cachedEntry) {
      // If cache is fresh, return cached response
      if (!isExpired(cachedEntry, now)) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        res.json(cachedEntry.data);
        return;
      }

      // Cache is expired, clear it
      console.log(`[CACHE EXPIRED] ${cacheKey}`);
      delete cacheStore[cacheKey];
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to intercept response
    res.json = function (body: any) {
      // Only cache successful responses (status 200)
      if (res.statusCode === 200) {
        // Cache the response data
        const timestamp = Date.now();
        cacheStore[cacheKey] = {
          data: body,
          expiresAt: timestamp + expireDurationMs,
          timestamp,
        };

        console.log(
          `[CACHE SET] ${cacheKey} (expires in ${Math.round(expireDurationMs / 1000)}s)`
        );
      }

      // Call original json method
      return originalJson(body);
    };

    next();
  };
}

/**
 * Clean up expired cache entries (useful for memory management)
 * Call this periodically to remove stale entries
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const key in cacheStore) {
    if (isExpired(cacheStore[key], now)) {
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
  entries: Array<{ key: string; expiresAt: number; timestamp: number }>;
} {
  const entries = Object.keys(cacheStore).map(key => ({
    key,
    expiresAt: cacheStore[key].expiresAt,
    timestamp: cacheStore[key].timestamp,
  }));

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

