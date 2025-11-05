import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  minute: number;
  timestamp: number;
}

interface CacheStore {
  [key: string]: CacheEntry;
}

// In-memory cache store
const cacheStore: CacheStore = {};

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
 * Get the current minute timestamp (Unix timestamp rounded to the minute)
 */
function getCurrentMinute(): number {
  const now = Date.now();
  return Math.floor(now / 60000); // Round down to the minute
}

/**
 * Express middleware for minute-based caching
 * Caches responses for the current minute and flushes when entering a new minute
 */
export function minuteCacheMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = generateCacheKey(req);
  const currentMinute = getCurrentMinute();

  // Check if we have cached data
  const cachedEntry = cacheStore[cacheKey];

  if (cachedEntry) {
    // If cache is from the current minute, return cached response
    if (cachedEntry.minute === currentMinute) {
      console.log(`[CACHE HIT] ${cacheKey} (minute: ${currentMinute})`);
      res.json(cachedEntry.data);
      return;
    }

    // Cache is from a previous minute, clear it
    console.log(
      `[CACHE EXPIRED] ${cacheKey} (old minute: ${cachedEntry.minute}, current minute: ${currentMinute})`
    );
    delete cacheStore[cacheKey];
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to intercept response
  res.json = function (body: any) {
    // Only cache successful responses (status 200)
    if (res.statusCode === 200) {
      // Cache the response data
      cacheStore[cacheKey] = {
        data: body,
        minute: currentMinute,
        timestamp: Date.now(),
      };

      console.log(`[CACHE SET] ${cacheKey} (minute: ${currentMinute})`);
    }

    // Call original json method
    return originalJson(body);
  };

  next();
}

/**
 * Clean up expired cache entries (useful for memory management)
 * Call this periodically to remove stale entries
 */
export function cleanupExpiredCache(): void {
  const currentMinute = getCurrentMinute();
  let cleanedCount = 0;

  for (const key in cacheStore) {
    if (cacheStore[key].minute < currentMinute) {
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
  entries: Array<{ key: string; minute: number; timestamp: number }>;
} {
  const entries = Object.keys(cacheStore).map(key => ({
    key,
    minute: cacheStore[key].minute,
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

