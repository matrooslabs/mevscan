import type { Express } from 'express';
import {
  Request,
  Response,
  BlockListItem,
  ErrorResponse,
  Transaction,
} from './types';
import { DEFAULTS } from '../constants';

/**
 * Register latest/recent data routes
 */
export function registerLatestRoutes(app: Express) {
  app.get('/api/latest-transactions', async (
    req: Request,
    res: Response<Transaction[] | ErrorResponse>
  ) => {
    try {
      const limit = parseInt(req.query.limit as string) || DEFAULTS.QUERY_LIMITS.LATEST_TRANSACTIONS;
      
      // Query bundle_header table only
      // Using PRIMARY KEY (block_number, tx_hash) for efficient querying
      const query = `
        SELECT 
          block_number,
          tx_hash,
          profit_usd as profit,
          mev_type,
          timeboosted,
          express_lane_controller,
          express_lane_price,
          express_lane_round
        FROM mev.bundle_header
        WHERE mev_type != 'SearcherTx'
        ORDER BY block_number DESC
        LIMIT ${limit}
      `;
  
      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });
  
      const data = await result.json<Array<{
        block_number: number;
        tx_hash: string;
        profit: number;
        mev_type: string;
        timeboosted: boolean;
        express_lane_controller: string | null;
        express_lane_price: string | null;
        express_lane_round: number | null;
      }>>();
  
      // Map to Transaction type
      const transactions: Transaction[] = data.map((row) => ({
        hash: row.tx_hash,
        blockNumber: row.block_number,
        profit: row.profit,
        mevType: row.mev_type,
        timeboosted: row.timeboosted,
        expressLaneController: row.express_lane_controller,
        expressLanePrice: row.express_lane_price,
        expressLaneRound: row.express_lane_round,
      }));
  
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching latest transactions:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch latest transactions',
      });
    }
  });
  
  // Get latest blocks
  app.get('/api/latest-blocks', async (
    req: Request,
    res: Response<BlockListItem[] | ErrorResponse>
  ) => {
    try {
      const limit = parseInt(req.query.limit as string) || DEFAULTS.QUERY_LIMITS.LATEST_TRANSACTIONS;
      
      // Query mev_blocks table
      // Using PRIMARY KEY (block_number, block_hash) for efficient querying
      const query = `
        SELECT 
          block_hash,
          block_number,
          arraySum(mev_count.mev_count) as mev_count,
          total_mev_profit_usd as total_profit,
          timeboosted_tx_count,
          timeboosted_tx_mev_count,
          eth_price
        FROM mev.mev_blocks
        WHERE mev_count > 0 OR timeboosted_tx_count > 0 OR timeboosted_tx_mev_count > 0
        ORDER BY block_number DESC
        LIMIT ${limit}
      `;
  
      const result = await req.clickhouse.query({
        query,
        format: 'JSONEachRow',
      });
  
      const data = await result.json<Array<{
        block_hash: string;
        block_number: number;
        mev_count: number;
        total_profit: number;
        timeboosted_tx_count: number;
        timeboosted_tx_mev_count: number;
        eth_price: number;
      }>>();
  
      // Map to BlockListItem type
      const blocks: BlockListItem[] = data.map((row) => ({
        hash: row.block_hash,
        number: row.block_number,
        mevCount: row.mev_count,
        totalProfit: row.total_profit,
        timeboostedTxCount: row.timeboosted_tx_count,
        timeboostedTxMevCount: row.timeboosted_tx_mev_count,
        ethPrice: row.eth_price,
      }));
  
      res.json(blocks);
    } catch (error) {
      console.error('Error fetching latest blocks:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch latest blocks',
      });
    }
  });
}
