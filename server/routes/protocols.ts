import type { Express } from 'express';
import {
  Request,
  Response,
  ErrorResponse,
  TimeSeriesByProtocolDataPoint,
  TimeSeriesByProtocolResponse,
} from './types';
import {
  formatRelativeTime,
  formatEthValue,
  getTimeRangeFilter,
  getTimestampTimeRangeFilter,
} from './types';
import { DEFAULTS } from '../constants';
import { transformProtocolTimeSeriesData, RawProtocolTimeSeriesRow } from '../utils/transformTimeSeries';
import { handleRouteError } from '../utils/errorHandler';

/**
 * Register protocols routes
 */
export function registerProtocolsRoutes(app: Express) {
  app.get('/api/protocols/atomic-mev/timeboosted', async (
    req: Request,
    res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || DEFAULTS.TIME_RANGE;
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
  SELECT
    toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) AS time,
    proto,
    sum(a.profit_usd / length(a.protocols)) AS profit_usd
  FROM mev.bundle_header AS b
  JOIN mev.atomic_arbs AS a ON a.tx_hash = b.tx_hash AND a.block_number = b.block_number
  JOIN ethereum.blocks AS e ON e.block_number = b.block_number
  ARRAY JOIN a.protocols AS proto
  WHERE 
    b.mev_type = 'AtomicArb'
    AND b.timeboosted = true
    AND a.arb_type = 'Triangular Arbitrage\n'
    AND ${timeFilter}
  GROUP BY time, proto
  ORDER BY time ASC, proto
      `;

      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        time: number;
        proto: string;
        profit_usd: number;
      }>>();

      const response: TimeSeriesByProtocolResponse = transformProtocolTimeSeriesData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Atomic MEV Timeboosted');
    }
  });

  // Get Atomic Arb MEV time series by protocol
  app.get('/api/protocols/atomic-mev', async (
    req: Request,
    res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || DEFAULTS.TIME_RANGE;
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
  WITH
      proto_list AS (
          SELECT DISTINCT
                 proto
          FROM   mev.atomic_arbs
          ARRAY  JOIN protocols AS proto
      ),
      real AS (
          SELECT
              toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) AS time,
              proto,
              sum(a.profit_usd / length(a.protocols))        AS profit_usd
          FROM   mev.bundle_header  AS b
          JOIN   mev.atomic_arbs    AS a  ON a.tx_hash     = b.tx_hash
          JOIN   ethereum.blocks    AS e  ON e.block_number = b.block_number
          ARRAY  JOIN a.protocols   AS proto
          WHERE 
            b.mev_type = 'AtomicArb'
            AND  replaceAll(a.arb_type, '\\n', '') = 'Triangular Arbitrage' 
            AND  ${timeFilter}
          GROUP BY
              time,
              proto
      )
  SELECT
      t.time as time,
      p.proto as proto,
      ifNull(r.profit_usd, 0) AS profit_usd
  FROM       (SELECT DISTINCT time FROM real) AS t
  CROSS JOIN proto_list             AS p
  LEFT  JOIN real                   AS r
         ON r.time  = t.time
        AND r.proto = p.proto
  ORDER BY
      t.time ASC,
      p.proto
      `;

      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        time: number;
        proto: string;
        profit_usd: number;
      }>>();

      const response: TimeSeriesByProtocolResponse = transformProtocolTimeSeriesData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Atomic Arb MEV');
    }
  });

  // Get CexDex Arb time series by protocol
  app.get('/api/protocols/cexdex', async (
    req: Request,
    res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || DEFAULTS.TIME_RANGE;
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
  WITH
      proto_list AS (
          SELECT DISTINCT
                 proto
          FROM   mev.cex_dex_quotes
          ARRAY  JOIN protocols AS proto
      ),
      real AS (
          SELECT
              toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) AS time,
              proto,
              sum(a.profit_usd / length(a.protocols))        AS profit_usd
          FROM   mev.bundle_header  AS b
          JOIN   mev.cex_dex_quotes    AS a  ON a.tx_hash     = b.tx_hash
          JOIN   ethereum.blocks    AS e  ON e.block_number = b.block_number
          ARRAY  JOIN a.protocols   AS proto
          WHERE 
            b.mev_type = 'CexDexQuotes'
            AND  ${timeFilter}
          GROUP BY
              time,
              proto
      )
  SELECT
      t.time AS time,
      p.proto AS proto,
      ifNull(r.profit_usd, 0) AS profit_usd
  FROM       (SELECT DISTINCT time FROM real) AS t
  CROSS JOIN proto_list             AS p
  LEFT  JOIN real                   AS r
         ON r.time  = t.time
        AND r.proto = p.proto
  ORDER BY
      time ASC,
      proto
      `;

      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        time: number;
        proto: string;
        profit_usd: number;
      }>>();

      const response: TimeSeriesByProtocolResponse = transformProtocolTimeSeriesData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'CexDex Arb');
    }
  });

  // Get CexDex MEV Timeboosted time series by protocol
  app.get('/api/protocols/cexdex/timeboosted', async (
    req: Request,
    res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || DEFAULTS.TIME_RANGE;
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
  WITH
      proto_list AS (
          SELECT DISTINCT
                 proto
          FROM   mev.cex_dex_quotes
          ARRAY  JOIN protocols AS proto
      ),
      real AS (
          SELECT
              toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) AS time,
              proto,
              sum(a.profit_usd / length(a.protocols))        AS profit_usd
          FROM   mev.bundle_header  AS b
          JOIN   mev.cex_dex_quotes    AS a  ON a.tx_hash     = b.tx_hash
          JOIN   ethereum.blocks    AS e  ON e.block_number = b.block_number
          ARRAY  JOIN a.protocols   AS proto
          WHERE 
            b.mev_type = 'CexDexQuotes'
            AND b.timeboosted = true 
            AND  ${timeFilter}
          GROUP BY
              time,
              proto
      )
  SELECT
      t.time AS time,
      p.proto AS proto,
      ifNull(r.profit_usd, 0) AS profit_usd
  FROM       (SELECT DISTINCT time FROM real) AS t
  CROSS JOIN proto_list             AS p
  LEFT  JOIN real                   AS r
         ON r.time  = t.time
        AND r.proto = p.proto
  ORDER BY
      time ASC,
      proto
      `;

      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        time: number;
        proto: string;
        profit_usd: number;
      }>>();

      const response: TimeSeriesByProtocolResponse = transformProtocolTimeSeriesData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'CexDex MEV Timeboosted');
    }
  });

  // Get Liquidation time series by protocol
  app.get('/api/protocols/liquidation', async (
    req: Request,
    res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || DEFAULTS.TIME_RANGE;
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
  WITH
      proto_list AS (
          SELECT DISTINCT
                 proto
          FROM   mev.liquidations
          ARRAY  JOIN protocols AS proto
      ),
      real AS (
          SELECT
              toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) AS time,
              proto,
              sum(a.profit_usd / length(a.protocols))        AS profit_usd
          FROM   mev.bundle_header  AS b
          JOIN   mev.liquidations    AS a  ON a.liquidation_tx_hash     = b.tx_hash
          JOIN   ethereum.blocks    AS e  ON e.block_number = b.block_number
          ARRAY  JOIN a.protocols   AS proto
          WHERE 
            b.mev_type = 'Liquidation'
            AND  ${timeFilter}
          GROUP BY
              time,
              proto
      )
  SELECT
      t.time AS time,
      p.proto AS proto,
      ifNull(r.profit_usd, 0) AS profit_usd
  FROM       (SELECT DISTINCT time FROM real) AS t
  CROSS JOIN proto_list             AS p
  LEFT  JOIN real                   AS r
         ON r.time  = t.time
        AND r.proto = p.proto
  ORDER BY
      time ASC,
      proto
      `;

      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        time: number;
        proto: string;
        profit_usd: number;
      }>>();

      const response: TimeSeriesByProtocolResponse = transformProtocolTimeSeriesData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Liquidation');
    }
  });

  // Get Liquidation Timeboosted time series by protocol
  app.get('/api/protocols/liquidation/timeboosted', async (
    req: Request,
    res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || DEFAULTS.TIME_RANGE;
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
  WITH
      proto_list AS (
          SELECT DISTINCT
                 proto
          FROM   mev.liquidations
          ARRAY  JOIN protocols AS proto
      ),
      real AS (
          SELECT
              toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) AS time,
              proto,
              sum(a.profit_usd / length(a.protocols))        AS profit_usd
          FROM   mev.bundle_header  AS b
          JOIN   mev.liquidations    AS a  ON a.liquidation_tx_hash     = b.tx_hash
          JOIN   ethereum.blocks    AS e  ON e.block_number = b.block_number
          ARRAY  JOIN a.protocols   AS proto
          WHERE 
            b.mev_type = 'Liquidation'
            AND  ${timeFilter}
            AND b.timeboosted = true
          GROUP BY
              time,
              proto
      )
  SELECT
      t.time AS time,
      p.proto AS proto,
      ifNull(r.profit_usd, 0) AS profit_usd
  FROM       (SELECT DISTINCT time FROM real) AS t
  CROSS JOIN proto_list             AS p
  LEFT  JOIN real                   AS r
         ON r.time  = t.time
        AND r.proto = p.proto
  ORDER BY
      time ASC,
      proto
      `;

      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        time: number;
        proto: string;
        profit_usd: number;
      }>>();

      const response: TimeSeriesByProtocolResponse = transformProtocolTimeSeriesData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Liquidation Timeboosted');
    }
  });


}