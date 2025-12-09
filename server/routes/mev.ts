import type { Express } from 'express';
import {
  Request,
  Response,
  ErrorResponse,
  TimeSeriesDataPoint,
  TimeSeriesResponse,
} from './types';
import {
  formatRelativeTime,
  formatEthValue,
  getTimeRangeFilter,
  getTimestampTimeRangeFilter,
} from './types';
import { DEFAULTS } from '../constants';

/**
 * Register mev routes
 */
export function registerMevRoutes(app: Express) {
  app.get('/api/gross-mev', async (
    req: Request,
    res: Response<TimeSeriesResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || DEFAULTS.TIME_RANGE;
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
        SELECT
          toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) as time,
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

      const result = await req.clickhouse.query({
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

      res.json(response);
    } catch (error) {
      console.error('Error fetching Gross MEV:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch Gross MEV',
      });
    }
  });

  // Get Gross Atomic Arb time series
  app.get('/api/gross-atomic-arb', async (
    req: Request,
    res: Response<TimeSeriesResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || DEFAULTS.TIME_RANGE;
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
        SELECT
          toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) as time,
          sum(m.profit_usd) as total,
          sumIf(m.profit_usd, m.timeboosted = false) as normal,
          sumIf(m.profit_usd, m.timeboosted = true) as timeboost
        FROM
          mev.bundle_header m
        LEFT JOIN ethereum.blocks AS e ON
          m.block_number = e.block_number
        INNER JOIN mev.atomic_arbs AS a ON
          m.tx_hash = a.tx_hash
        WHERE
          m.mev_type = 'AtomicArb'
          AND
          (replaceAll(a.arb_type, '\\n', '') = 'Triangular Arbitrage')
          AND
          ${timeFilter}
        GROUP BY
          time
        ORDER BY
          time ASC
      `;

      const result = await req.clickhouse.query({
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

      res.json(response);
    } catch (error) {
      console.error('Error fetching Gross Atomic Arb:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch Gross Atomic Arb',
      });
    }
  });

  // Get Gross CexDexQuotes time series
  app.get('/api/gross-cex-dex-quotes', async (
    req: Request,
    res: Response<TimeSeriesResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || DEFAULTS.TIME_RANGE;
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
        SELECT
          toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) AS time,
          sum(m.profit_usd) AS total,
          sumIf(m.profit_usd, m.timeboosted = false) as normal,
          sumIf(
            m.profit_usd,
            m.timeboosted = true            
          ) AS timeboost
        FROM
          mev.bundle_header AS m
        LEFT JOIN ethereum.blocks AS e
          ON m.block_number = e.block_number
        WHERE
          m.mev_type = 'CexDexQuotes'
          AND 
          ${timeFilter}
        GROUP BY
          time
        ORDER BY
          time ASC
      `;

      const result = await req.clickhouse.query({
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

      res.json(response);
    } catch (error) {
      console.error('Error fetching Gross CexDexQuotes:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch Gross CexDexQuotes',
      });
    }
  });

  // Get Gross Liquidation time series
  app.get('/api/gross-liquidation', async (
    req: Request,
    res: Response<TimeSeriesResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || DEFAULTS.TIME_RANGE;
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
        SELECT
          toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) AS time,
          sum(m.profit_usd) AS total,
          sumIf(
            m.profit_usd,
            m.timeboosted = false            
          ) AS normal,
          sumIf(
            m.profit_usd,
            m.timeboosted = true            
          ) AS timeboost
        FROM
          mev.bundle_header AS m
        LEFT JOIN ethereum.blocks AS e
          ON m.block_number = e.block_number
        WHERE
          m.mev_type = 'Liquidation'
          AND 
          ${timeFilter}
        GROUP BY
          time
        ORDER BY
          time ASC
      `;

      const result = await req.clickhouse.query({
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

      res.json(response);
    } catch (error) {
      console.error('Error fetching Gross Liquidation:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch Gross Liquidation',
      });
    }
  });


}