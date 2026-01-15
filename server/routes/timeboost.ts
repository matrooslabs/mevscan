import type { Express } from 'express';
import {
  Request,
  Response,
  AuctionWinCountResponse,
  BidsPerAddressResponse,
  BidsPerRoundResponse,
  ErrorResponse,
  ExpressLanePriceResponse,
  TimeboostRevenueResponse,
} from './types';
import { getTimestampTimeRangeFilter } from './types';
import { handleRouteError } from '../utils/errorHandler';

/**
 * Register timeboost routes
 */
export function registerTimeboostRoutes(app: Express) {
  app.get(
    '/api/timeboost/gross-revenue',
    async (req: Request, res: Response<TimeboostRevenueResponse | ErrorResponse>) => {
      try {
        const query = `
        SELECT
          sum(first_price) AS total_first_price,
          sum(second_price) AS total_second_price
        FROM (
          SELECT
            round,
            maxIf(price, rank = 1) AS first_price,
            anyIf(bidder, rank = 1) AS winner,
            maxIf(price, rank = 2) AS second_price,
            anyIf(bidder, rank = 2) AS second_place
          FROM (
            SELECT
              round,
              toFloat64(amount) / 1e18 AS price,
              bidder,
              row_number() OVER (PARTITION BY round ORDER BY toFloat64(amount) DESC) AS rank
            FROM timeboost.bids
          )
          GROUP BY round
        )
      `;

        const result = await req.clickhouse.query({
          query,
          format: 'JSONEachRow',
        });

        const data = await result.json<
          Array<{
            total_first_price: number;
            total_second_price: number;
          }>
        >();

        const response: TimeboostRevenueResponse =
          data.length > 0
            ? {
                total_first_price: data[0].total_first_price || 0,
                total_second_price: data[0].total_second_price || 0,
              }
            : {
                total_first_price: 0,
                total_second_price: 0,
              };

        res.json(response);
      } catch (error) {
        handleRouteError(error, res, 'Timeboost Gross Revenue');
      }
    }
  );

  // Get Timeboost Revenue (time-ranged)
  app.get(
    '/api/timeboost/revenue',
    async (req: Request, res: Response<TimeboostRevenueResponse | ErrorResponse>) => {
      try {
        const timeRange = (req.query.timeRange as string) || '1d';
        const timeFilter = getTimestampTimeRangeFilter(timeRange);

        const query = `
        SELECT
          sum(first_price) AS total_first_price,
          sum(second_price) AS total_second_price
        FROM (
          SELECT
            round,
            maxIf(price, rank = 1) AS first_price,
            anyIf(bidder, rank = 1) AS winner,
            maxIf(price, rank = 2) AS second_price,
            anyIf(bidder, rank = 2) AS second_place
          FROM (
            SELECT
              round,
              toFloat64(amount) / 1e18 AS price,
              bidder,
              row_number() OVER (PARTITION BY round ORDER BY toFloat64(amount) DESC) AS rank
            FROM timeboost.bids
            WHERE ${timeFilter}
          )
          GROUP BY round
        )
      `;

        const result = await req.clickhouse.query({
          query,
          format: 'JSONEachRow',
        });

        const data = await result.json<
          Array<{
            total_first_price: number;
            total_second_price: number;
          }>
        >();

        const response: TimeboostRevenueResponse =
          data.length > 0
            ? {
                total_first_price: data[0].total_first_price || 0,
                total_second_price: data[0].total_second_price || 0,
              }
            : {
                total_first_price: 0,
                total_second_price: 0,
              };

        res.json(response);
      } catch (error) {
        handleRouteError(error, res, 'Timeboost Revenue');
      }
    }
  );

  // Get Bids per Address
  app.get(
    '/api/timeboost/bids-per-address',
    async (req: Request, res: Response<BidsPerAddressResponse | ErrorResponse>) => {
      try {
        const timeRange = (req.query.timeRange as string) || '1d';
        const timeFilter = getTimestampTimeRangeFilter(timeRange);

        const query = `
        SELECT 
          bidder, 
          count(*) as bid_count 
        FROM timeboost.bids 
        WHERE ${timeFilter} 
        GROUP BY bidder
        ORDER BY bid_count DESC
      `;

        const result = await req.clickhouse.query({
          query,
          format: 'JSONEachRow',
        });

        const data = await result.json<
          Array<{
            bidder: string;
            bid_count: number;
          }>
        >();

        const response: BidsPerAddressResponse = data.map((row) => ({
          bidder: row.bidder || '',
          bid_count: row.bid_count || 0,
        }));

        res.json(response);
      } catch (error) {
        handleRouteError(error, res, 'Bids per Address');
      }
    }
  );

  // Get Auction Win Count
  app.get(
    '/api/timeboost/auction-win-count',
    async (req: Request, res: Response<AuctionWinCountResponse | ErrorResponse>) => {
      try {
        const timeRange = (req.query.timeRange as string) || '1d';
        const timeFilter = getTimestampTimeRangeFilter(timeRange);

        const query = `
        SELECT
          winner AS address,
          COUNT(*) AS wins
        FROM (
          SELECT
            round,
            argMax(bidder, toUInt256(amount)) AS winner
          FROM timeboost.bids
          WHERE ${timeFilter}
          GROUP BY round
        )
        GROUP BY address
        ORDER BY wins DESC
        LIMIT 15
      `;

        const result = await req.clickhouse.query({
          query,
          format: 'JSONEachRow',
        });

        const data = await result.json<
          Array<{
            address: string;
            wins: number;
          }>
        >();

        const response: AuctionWinCountResponse = data.map((row) => ({
          address: row.address || '',
          wins: row.wins || 0,
        }));

        res.json(response);
      } catch (error) {
        handleRouteError(error, res, 'Auction Win Count');
      }
    }
  );

  // Get Bids per Round
  app.get(
    '/api/timeboost/bids-per-round',
    async (req: Request, res: Response<BidsPerRoundResponse | ErrorResponse>) => {
      try {
        const query = `
        SELECT 
          round, 
          count(*) AS bid_count 
        FROM timeboost.bids 
        WHERE round > (SELECT max(round) FROM timeboost.bids) - 15 
        GROUP BY round 
        ORDER BY round ASC
      `;

        const result = await req.clickhouse.query({
          query,
          format: 'JSONEachRow',
        });

        const data = await result.json<
          Array<{
            round: number;
            bid_count: number;
          }>
        >();

        const response: BidsPerRoundResponse = data.map((row) => ({
          round: row.round || 0,
          bid_count: row.bid_count || 0,
        }));

        res.json(response);
      } catch (error) {
        handleRouteError(error, res, 'Bids per Round');
      }
    }
  );

  // Get Express Lane Price
  app.get(
    '/api/timeboost/express-lane-price',
    async (req: Request, res: Response<ExpressLanePriceResponse | ErrorResponse>) => {
      try {
        const timeRange = (req.query.timeRange as string) || '1d';
        const timeFilter = getTimestampTimeRangeFilter(timeRange);

        const query = `
        SELECT
          round,
          maxIf(price, rank = 1) AS first_price,
          anyIf(bidder, rank = 1) AS winner,
          maxIf(price, rank = 2) AS second_price,
          anyIf(bidder, rank = 2) AS second_place
        FROM (
          SELECT
            round,
            toFloat64(amount) / 1e18 AS price,
            bidder,
            row_number() OVER (PARTITION BY round ORDER BY toFloat64(amount) DESC) AS rank
          FROM timeboost.bids
          WHERE ${timeFilter}
        )
        GROUP BY round
        ORDER BY round ASC
      `;

        const result = await req.clickhouse.query({
          query,
          format: 'JSONEachRow',
        });

        const data = await result.json<
          Array<{
            round: number;
            first_price: number;
            winner: string;
            second_price: number;
            second_place: string;
          }>
        >();

        const response: ExpressLanePriceResponse = data.map((row) => ({
          round: row.round || 0,
          first_price: row.first_price || 0,
          second_price: row.second_price || 0,
          winner: row.winner || '',
          second_place: row.second_place || '',
        }));

        res.json(response);
      } catch (error) {
        handleRouteError(error, res, 'Express Lane Price');
      }
    }
  );
}
