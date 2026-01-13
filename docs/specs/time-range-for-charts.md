# Time Range for Charts

## Overview

Enable users to view historical MEV data across multiple time ranges. Currently the server defaults to 24-hour data with no UI controls. We want to support selectable time ranges (24H, 1W, 30D, 90D) with appropriate data resolution scaling and an optimized caching strategy.

## Implementation Plan

This feature will be delivered in two PRs:

| PR | Scope | Dependencies |
|----|-------|--------------|
| **PR1** | Add timeRange parameter to backend & frontend | None |
| **PR2** | Improve cache behavior (stale-while-revalidate, pre-warming) | PR1 |

---

# PR1: Time Range Parameter

## Goal
Add selectable time range (24H, 1W, 30D, 90D) to all time-series charts with full backend support.

## Frontend Changes

### Button Group Component
Add a button group at the top-right corner of the TimeSeries chart:

| Button | Backend Value | Description |
|--------|---------------|-------------|
| 24H | `1d` | Last 24 hours (real-time monitoring) |
| 1W | `7d` | Last 7 days (short-term trends) |
| 30D | `30d` | Last 30 days (monthly analysis) |
| 90D | `90d` | Last 90 days (quarterly view) |

### Implementation Details
- Add time range selector to `TimeSeriesChart` component for reusability
- All charts on the dashboard should sync to the same time range (global state)
- Persist selected range in URL param (`?range=30d`) for shareable links
- Fallback to localStorage for cross-session persistence
- Default to `1d` if no preference is set

### Time Formatting by Range
Adjust x-axis label formatting based on selected range:
- **24H / 1W**: Display as `"HH:mm"` (e.g., "14:30")
- **30D / 90D**: Display as `"MMM DD"` (e.g., "Jan 10")

### Loading States
- Use React Query's `keepPreviousData: true` to show previous data while loading
- Display subtle "updating" indicator when fetching new range
- Show skeleton loader only on complete cache miss

### Frontend Checklist
- [ ] Create `useTimeRange` hook for global time range state
- [ ] Add time range button group to `TimeSeriesChart` component
- [ ] Update `apiClient.ts` methods to accept timeRange parameter
- [ ] Update `useApi.ts` hooks to pass timeRange to API calls
- [ ] Add time formatting utility based on selected range
- [ ] Update URL params when time range changes
- [ ] Persist time range preference to localStorage

## Backend Changes

### Supported Time Ranges
Remove legacy time ranges and standardize on:
```
1d, 7d, 30d, 90d
```

Remove: `6hours`, `12hours`, `3days`, `14days`, `180d`

### Data Resolution Scaling
Dynamically adjust GROUP BY time window based on requested range to optimize query performance and reduce data points:

| Time Range | SQL Grouping | Max Data Points |
|------------|--------------|-----------------|
| 1d | `toStartOfHour` | 24 |
| 7d | `toStartOfHour` | 168 |
| 30d | `toStartOfDay` | 30 |
| 90d | `toStartOfDay` | 90 |

Implementation in `/server/helper.ts`:
```typescript
export function getTimeGrouping(timeRange: string): string {
  switch (timeRange) {
    case '1d':
    case '7d':
      return 'toStartOfHour';
    case '30d':
    case '90d':
      return 'toStartOfDay';
    default:
      return 'toStartOfHour';
  }
}
```

### Response Format Change
Return Unix timestamps (seconds) instead of formatted strings. Let the frontend handle formatting based on the selected range.

**Before:**
```json
{ "time": "14:30", "total": 1234, "normal": 1000, "timeboost": 234 }
```

**After:**
```json
{ "time": 1736517600, "total": 1234, "normal": 1000, "timeboost": 234 }
```

### Endpoints to Update
Ensure all time-series endpoints support the `timeRange` query parameter:

- `/api/gross-mev`
- `/api/gross-atomic-arb`
- `/api/gross-cex-dex-quotes`
- `/api/gross-liquidation`
- `/api/protocols/atomic-mev`
- `/api/protocols/atomic-mev/timeboosted`
- `/api/protocols/cexdex`
- `/api/protocols/cexdex/timeboosted`
- `/api/protocols/liquidation`
- `/api/protocols/liquidation/timeboosted`
- `/api/express-lane/mev-percentage-per-minute`
- `/api/timeboost/revenue`
- `/api/timeboost/bids-per-address`
- `/api/timeboost/auction-win-count`
- `/api/timeboost/express-lane-price`

### Backend Checklist
- [ ] Update `/server/helper.ts` with new time range values and validation
- [ ] Add `getTimeGrouping()` helper function
- [ ] Update all route handlers to use dynamic time grouping
- [ ] Change response format to return Unix timestamps
- [ ] Update `/server/utils/transformTimeSeries.ts` to skip time formatting

### Testing (PR1)
- [ ] Test all endpoints with each time range value
- [ ] Verify data resolution matches expected grouping
- [ ] Test UI state persistence across page reloads
- [ ] Verify time formatting displays correctly for each range

---

# PR2: Cache Improvements

## Goal
Implement stale-while-revalidate caching pattern and cache pre-warming to eliminate user wait times on cache misses.

## Prerequisites
- PR1 must be merged (time range parameter support)

## Current Problem
On cache miss or expiry, users must wait for the full database query to complete. For 90-day queries, this can take several seconds.

## Stale-While-Revalidate Pattern

Implement the following cache behavior:

```
Request: GET /api/gross-mev?timeRange=30d

Case 1: Fresh cache exists (within TTL)
  → Return cached data immediately

Case 2: Stale cache exists (past TTL but data available)
  → Return stale data immediately
  → Trigger background refresh (non-blocking)
  → Next request gets fresh data

Case 3: No cache (cold start)
  → Fetch from database (user waits)
  → Cache result for future requests
```

## Cache TTL by Range
Longer time ranges change less frequently, so use longer TTLs:

| Time Range | Cache TTL |
|------------|-----------|
| 1d | 5 minutes |
| 7d | 10 minutes |
| 30d | 30 minutes |
| 90d | 60 minutes |

## Background Refresh Implementation

Update `/server/middleware/cache.ts`:

```typescript
interface CacheEntry {
  data: unknown;
  createdAt: number;
  ttl: number;
}

function isFresh(entry: CacheEntry): boolean {
  return Date.now() < entry.createdAt + entry.ttl;
}

function isStale(entry: CacheEntry): boolean {
  return !isFresh(entry);
}

// Non-blocking background refresh
function triggerBackgroundRefresh(key: string, fetchFn: () => Promise<unknown>) {
  setImmediate(async () => {
    try {
      const freshData = await fetchFn();
      cache.set(key, {
        data: freshData,
        createdAt: Date.now(),
        ttl: getTTLForKey(key)
      });
      console.log(`[CACHE REFRESH] ${key}`);
    } catch (error) {
      console.error(`[CACHE REFRESH ERROR] ${key}`, error);
    }
  });
}
```

## Cache Pre-warming

For expensive long-range queries, pre-warm cache on server startup and periodically.

**On startup:**
```typescript
async function prewarmCache() {
  const endpoints = [
    '/api/gross-mev',
    '/api/gross-atomic-arb',
    '/api/gross-cex-dex-quotes',
    '/api/gross-liquidation'
  ];
  const ranges = ['30d', '90d'];

  for (const endpoint of endpoints) {
    for (const range of ranges) {
      await internalFetch(`${endpoint}?timeRange=${range}`);
      await sleep(100); // Avoid overwhelming database
    }
  }
  console.log('[CACHE] Pre-warming complete');
}
```

**Scheduled refresh (every 30 minutes):**
```typescript
setInterval(prewarmCache, 30 * 60 * 1000);
```

## Backend Checklist (PR2)
- [ ] Refactor cache middleware to support stale-while-revalidate
- [ ] Add `CacheEntry` interface with `createdAt` and `ttl` fields
- [ ] Implement `triggerBackgroundRefresh()` function
- [ ] Add TTL configuration per time range
- [ ] Implement `getTTLForKey()` helper to extract timeRange from cache key
- [ ] Add cache pre-warming function
- [ ] Call pre-warm on server startup (after routes registered)
- [ ] Add scheduled cache refresh interval

## Testing (PR2)
- [ ] Test fresh cache returns immediately
- [ ] Test stale cache returns immediately and triggers background refresh
- [ ] Test cold cache fetches from database
- [ ] Verify pre-warming populates cache on startup
- [ ] Verify scheduled refresh keeps cache warm
- [ ] Performance test: measure response times before/after

---

## Notes

- The 180d range is omitted for now but can be added later if needed
- Consider adding a "Custom" range option in future iterations
- Monitor ClickHouse query performance for 90-day queries and optimize indexes if needed
