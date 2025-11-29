import { ClickHouseClient } from '@clickhouse/client';
import type { TimeSeriesResponse, TimeSeriesDataPoint } from '@mevscan/shared';
import { TIME_RANGES } from '@mevscan/shared/constants';

/**
 * Helper function to generate time range filter for block_timestamp
 */
function getTimeRangeFilter(timeRange: string): string {
    const range = timeRange || '15min';

    if (!TIME_RANGES.includes(range)) {
        throw new Error(`Invalid timeRange. Must be one of: ${TIME_RANGES.join(', ')}`);
    }

    switch (range) {
        case '5min':
            return `e.block_timestamp >= now() - INTERVAL 5 MINUTE`;
        case '15min':
            return `e.block_timestamp >= now() - INTERVAL 15 MINUTE`;
        case '30min':
            return `e.block_timestamp >= now() - INTERVAL 30 MINUTE`;
        case '1hour':
            return `e.block_timestamp >= now() - INTERVAL 1 HOUR`;
        case '12hours':
            return `e.block_timestamp >= now() - INTERVAL 12 HOUR`;
        default:
            return `e.block_timestamp >= now() - INTERVAL 15 MINUTE`;
    }
}

/**
 * Fetches Gross MEV time series data from ClickHouse
 * @param clickhouse - ClickHouse client instance
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour, 12hours)
 * @returns TimeSeriesResponse with gross MEV data
 */
export async function getGrossMEV(
    clickhouse: ClickHouseClient,
    timeRange: string = '15min'
): Promise<TimeSeriesResponse> {
    const timeFilter = getTimeRangeFilter(timeRange);

    const query = `
  SELECT
    toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) as time,
    sum(m.profit_usd) as total,
    sumIf(m.profit_usd, m.timeboosted = false) as normal,
    sumIf(m.profit_usd, m.timeboosted = true) as timeboost
  FROM
    mev.bundle_header AS m
  LEFT JOIN ethereum.blocks AS e
    ON m.block_number = e.block_number
  LEFT JOIN mev.atomic_arbs AS a
    ON a.tx_hash = m.tx_hash
  WHERE
    (m.mev_type = 'CexDexQuotes' OR m.mev_type = 'AtomicArb' OR m.mev_type = 'Liquidation')
    AND (replaceAll(a.arb_type, '\\n', '') = 'Triangular Arbitrage'
      or a.arb_type = '')
    AND ${timeFilter}
  GROUP BY
    time
  ORDER BY
    time ASC
`;


    const result = await clickhouse.query({
        query,
        format: 'JSONEachRow',
    });

    const data = await result.json<Array<{
        time: number;
        total: number;
        normal: number;
        timeboost: number;
    }>>();

    const response: TimeSeriesResponse = data
        .filter((row) => row.time != null && !isNaN(row.time))
        .map((row) => {
            const date = new Date(row.time * 1000);
            if (isNaN(date.getTime())) {
                return null;
            }
            const hours = date.getHours().toString().padStart(2, '0');
            const mins = date.getMinutes().toString().padStart(2, '0');
            return {
                time: `${hours}:${mins}`,
                total: row.total || 0,
                normal: row.normal || 0,
                timeboost: row.timeboost || 0,
            };
        })
        .filter((item): item is TimeSeriesDataPoint => item !== null);

    return response;
}



