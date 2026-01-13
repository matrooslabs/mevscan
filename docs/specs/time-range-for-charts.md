# Time Range for Charts

## Overview

Enable users to view historical MEV data across multiple time ranges. Currently the server defaults to 24-hour data with no UI controls. We want to support selectable time ranges (24H, 1W, 30D, 90D) with appropriate data resolution scaling and an optimized caching strategy.

## Implementation Plan

This feature will be delivered in two PRs:

| PR | Scope | Dependencies |
|----|-------|--------------|
| **PR1** | Add timeRange parameter to backend & frontend | None |
| **PR2** | Simplify caching with apicache library | PR1 |

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

# PR2: Simplify Caching

## Goal
Replace custom cache middleware with the battle-tested `apicache` library for simpler, more maintainable caching.

## Prerequisites
- PR1 must be merged (time range parameter support)

## Implementation

### Use apicache Library
Replace the custom cache implementation with [apicache](https://github.com/kwhitley/apicache):

```typescript
import apicache from 'apicache';

export function cacheMiddleware(duration = '5 minutes') {
  return apicache.middleware(duration);
}
```

### Cache Behavior
- All GET requests with 2xx responses are cached for 5 minutes
- Cache keys are automatically generated from URL + query string
- Automatic cache expiry (no manual cleanup needed)

### Files Changed
- `server/middlewares.ts` - Use apicache instead of custom implementation
- `server/index.ts` - Remove `setupCacheCleanup()` call
- `server/middleware/cache.ts` - Deleted (no longer needed)

## Backend Checklist (PR2)
- [x] Install `apicache` and `@types/apicache`
- [x] Update `server/middlewares.ts` to use apicache
- [x] Remove custom cache middleware file
- [x] Remove manual cache cleanup setup

## Testing (PR2)
- [ ] Verify `x-apicache-*` headers in API responses
- [ ] Test cache hit on repeated requests
- [ ] Verify cache expires after 5 minutes

---

## Notes

- The 180d range is omitted for now but can be added later if needed
- Consider adding a "Custom" range option in future iterations
- Monitor ClickHouse query performance for 90-day queries and optimize indexes if needed
- If per-route TTLs are needed in the future, apicache supports per-route configuration
