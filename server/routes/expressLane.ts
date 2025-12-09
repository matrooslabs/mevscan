import type { Express } from 'express';
import {
  Request,
  Response,
  ErrorResponse,
  ExpressLaneNetProfitResponse,
  ExpressLaneProfitByControllerResponse,
  PieChartResponse,
  TimeSeriesPercentageDataPoint,
  TimeSeriesPercentageResponse,
} from './types';
import {
  formatRelativeTime,
  formatEthValue,
  getTimeRangeFilter,
  getTimestampTimeRangeFilter,
} from './types';
import { transformTimeSeriesPercentageData, RawTimeSeriesPercentageRow } from '../utils/transformTimeSeries';
import { handleRouteError } from '../utils/errorHandler';

/**
 * Register expresslane routes
 */
export function registerExpressLaneRoutes(app: Express) {
  app.get('/api/express-lane/mev-percentage', async (
    req: Request,
    res: Response<PieChartResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || '24hours';
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
        SELECT
          sum(m.profit_usd) AS total,
          sumIf(m.profit_usd, m.timeboosted = 1) AS timeboost,
          timeboost / total * 100 AS percentage
        FROM ethereum.blocks AS e
        LEFT JOIN mev.bundle_header AS m
          ON m.block_number = e.block_number
        LEFT JOIN mev.atomic_arbs AS a
          ON a.tx_hash = m.tx_hash
        WHERE (m.mev_type = 'CexDexQuotes' OR m.mev_type='AtomicArb' OR m.mev_type='Liquidation')
          AND (
            a.arb_type = ''
            OR replaceAll(a.arb_type, '\\n', '') = 'Triangular Arbitrage'
          )
          AND ${timeFilter}
      `;

      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        total: number;
        timeboost: number;
        percentage: number;
      }>>();

      if (data.length === 0) {
        res.json({
          total: 0,
          timeboost: 0,
          percentage: 0,
        });
        return;
      }

      const row = data[0];
      const response: PieChartResponse = {
        total: row.total || 0,
        timeboost: row.timeboost || 0,
        percentage: row.percentage || 0,
      };

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Express Lane MEV Percentage');
    }
  });

  // Get Express Lane MEV Percentage per minute time series
  app.get('/api/express-lane/mev-percentage-per-minute', async (
    req: Request,
    res: Response<TimeSeriesPercentageResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || '24hours';
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
        SELECT
          toUnixTimestamp(toStartOfHour(toDateTime(e.block_timestamp))) AS time,
          sum(m.profit_usd)                              AS total,
          sumIf(m.profit_usd, m.timeboosted = 1)         AS timeboost,
          timeboost / total * 100                        AS percentage
        FROM ethereum.blocks        AS e
        LEFT JOIN mev.bundle_header AS m
               ON m.block_number = e.block_number
        LEFT JOIN mev.atomic_arbs   AS a
               ON a.tx_hash = m.tx_hash
        WHERE (m.mev_type = 'CexDexQuotes' OR m.mev_type='AtomicArb' OR m.mev_type='Liquidation')
          AND (
                a.arb_type = ''
                OR replaceAll(a.arb_type, '\\n', '') = 'Triangular Arbitrage'
              )
          AND ${timeFilter}
        GROUP BY time
        ORDER BY time ASC
      `;

      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        time: number;
        total: number;
        timeboost: number;
        percentage: number;
      }>>();

      const response: TimeSeriesPercentageResponse = transformTimeSeriesPercentageData(data);

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Express Lane MEV Percentage per minute');
    }
  });

  // Get Express Lane Net Profit
  app.get('/api/express-lane/net-profit', async (
    req: Request,
    res: Response<ExpressLaneNetProfitResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || '24hours';
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
        SELECT
          bh.express_lane_round AS round,
          bh.express_lane_controller AS controller,
          any(bh.express_lane_price_usd) AS price,
          sum(bh.profit_usd) AS profit,
          sum(bh.profit_usd) - any(bh.express_lane_price_usd) AS net_profit
        FROM
          mev.bundle_header AS bh 
        LEFT JOIN
          ethereum.blocks AS e
          ON
          bh.block_number = e.block_number
        WHERE
          bh.express_lane_price_usd IS NOT NULL
          AND bh.timeboosted = true
          AND (bh.mev_type='CexDexQuotes' OR bh.mev_type='AtomicArb' OR bh.mev_type='Liquidation')
          AND ${timeFilter}
        GROUP BY
          bh.express_lane_round, bh.express_lane_controller
        ORDER BY
          bh.express_lane_round DESC
        LIMIT 100
      `;

      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        round: number;
        controller: string;
        price: number;
        profit: number;
        net_profit: number;
      }>>();

      const response: ExpressLaneNetProfitResponse = data.map((row) => ({
        round: row.round || 0,
        controller: row.controller || '',
        price: row.price || 0,
        profit: row.profit || 0,
        net_profit: row.net_profit || 0,
      }));

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Express Lane Net Profit');
    }
  });

  // Get Express Lane Profit by Controller
  app.get('/api/express-lane/profit-by-controller', async (
    req: Request,
    res: Response<ExpressLaneProfitByControllerResponse | ErrorResponse>
  ) => {
    try {
      const timeRange = (req.query.timeRange as string) || '24hours';
      const timeFilter = getTimeRangeFilter(timeRange);
    
      const query = `
        SELECT 
          controller,
          sum(net_profit) as net_profit_total
        FROM
          (
          SELECT
            bh.express_lane_controller AS controller,
            bh.express_lane_round AS round,
            sum(bh.profit_usd) as profit,
            any(bh.express_lane_price_usd) as price,
            sum(bh.profit_usd) - any(bh.express_lane_price_usd) AS net_profit
          FROM
            mev.bundle_header bh
          LEFT JOIN ethereum.blocks AS e
                 ON
            bh.block_number = e.block_number
          WHERE
            bh.express_lane_price_usd IS NOT NULL
            AND bh.express_lane_controller IS NOT NULL
            AND bh.timeboosted = TRUE
            AND (bh.mev_type='CexDexQuotes' OR bh.mev_type='AtomicArb' OR bh.mev_type='Liquidation')
            AND ${timeFilter}
          GROUP BY
            round,
            controller
          ORDER BY
            bh.express_lane_round DESC
        ) AS per_round
        GROUP BY
          controller
      `;

      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        controller: string;
        net_profit_total: number;
      }>>();

      const response: ExpressLaneProfitByControllerResponse = data.map((row) => ({
        controller: row.controller || '',
        net_profit_total: row.net_profit_total || 0,
      }));

      res.json(response);
    } catch (error) {
      handleRouteError(error, res, 'Express Lane Profit by Controller');
    }
  });


}