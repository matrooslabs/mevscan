import http from 'http';
import { setCacheEntry, getTTLForKey, registerFetchFunction } from './cache';
import { config } from '../config';

/**
 * Endpoints to pre-warm on startup
 * Focus on expensive long-range queries (30d, 90d)
 */
const PREWARM_ENDPOINTS = [
  '/api/gross-mev',
  '/api/gross-atomic-arb',
  '/api/gross-cex-dex-quotes',
  '/api/gross-liquidation',
];

/**
 * Time ranges to pre-warm (focus on expensive queries)
 */
const PREWARM_RANGES = ['30d', '90d'];

/**
 * Delay between pre-warm requests to avoid overwhelming database
 */
const PREWARM_DELAY_MS = 100;

/**
 * Interval for scheduled cache refresh (30 minutes)
 */
const SCHEDULED_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make an HTTP request to the local server
 */
function httpGet(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:${config.server.port}${path}`;

    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fetch data from an endpoint with a specific time range
 */
async function fetchEndpointData(endpoint: string, timeRange: string): Promise<unknown> {
  const path = `${endpoint}?timeRange=${timeRange}`;
  return httpGet(path);
}

/**
 * Pre-warm cache for expensive queries on startup
 */
export async function prewarmCache(): Promise<void> {
  console.log('[CACHE] Starting pre-warm...');
  let warmedCount = 0;
  let errorCount = 0;

  for (const endpoint of PREWARM_ENDPOINTS) {
    for (const range of PREWARM_RANGES) {
      const cacheKey = `${endpoint}?timeRange=${range}`;

      try {
        const data = await fetchEndpointData(endpoint, range);
        const ttl = getTTLForKey(cacheKey);

        setCacheEntry(cacheKey, data, ttl);

        // Register fetch function for background refresh
        registerFetchFunction(cacheKey, () => fetchEndpointData(endpoint, range));

        warmedCount++;
        console.log(`[CACHE PREWARM] ${cacheKey}`);
      } catch (error) {
        errorCount++;
        console.error(`[CACHE PREWARM ERROR] ${cacheKey}:`, error);
      }

      // Avoid overwhelming database
      await sleep(PREWARM_DELAY_MS);
    }
  }

  console.log(`[CACHE] Pre-warm complete: ${warmedCount} entries cached, ${errorCount} errors`);
}

/**
 * Setup scheduled cache refresh
 * Refreshes expensive queries periodically to keep cache warm
 */
export function setupScheduledCacheRefresh(): void {
  console.log(`[CACHE] Setting up scheduled refresh (every ${SCHEDULED_REFRESH_INTERVAL_MS / 60000} minutes)`);

  setInterval(async () => {
    console.log('[CACHE] Starting scheduled refresh...');
    await prewarmCache();
  }, SCHEDULED_REFRESH_INTERVAL_MS);
}

/**
 * Initialize cache warming system
 * Call this after routes are registered and server is listening
 */
export async function initializeCacheWarming(): Promise<void> {
  // Pre-warm cache on startup
  await prewarmCache();

  // Setup scheduled refresh
  setupScheduledCacheRefresh();
}
