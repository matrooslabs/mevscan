import type { Express } from 'express';
import {
  Request,
  Response,
  ErrorResponse,
  TimeSeriesResponse,
} from './types';
import {
  getTimeRangeFilter,
} from './types';
import { transformTimeSeriesData } from '../utils/transformTimeSeries';
import { handleRouteError } from '../utils/errorHandler';

/**
 * Register mev routes
 */
export function registerMevRoutes(app: Express) {
  app.get('/api/gross-mev', async (
    req: Request,
    res: Response<TimeSeriesResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || '24hours';
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

      const response: TimeSeriesResponse = transformTimeSeriesData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Gross MEV');
    }
  });

  // Get Gross Atomic Arb time series
  app.get('/api/gross-atomic-arb', async (
    req: Request,
    res: Response<TimeSeriesResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || '24hours';
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

      const response: TimeSeriesResponse = transformTimeSeriesData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Gross Atomic Arb');
    }
  });

  // Get Gross CexDexQuotes time series
  app.get('/api/gross-cex-dex-quotes', async (
    req: Request,
    res: Response<TimeSeriesResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || '24hours';
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

      const response: TimeSeriesResponse = transformTimeSeriesData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Gross CexDexQuotes');
    }
  });

  // Get Gross Liquidation time series
  app.get('/api/gross-liquidation', async (
    req: Request,
    res: Response<TimeSeriesResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || '24hours';
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

      const response: TimeSeriesResponse = transformTimeSeriesData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Gross Liquidation');
    }
  });


}
