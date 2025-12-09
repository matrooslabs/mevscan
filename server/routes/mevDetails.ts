import type { Express } from 'express';
import {
  Request,
  Response,
  AtomicArbResponse,
  CexDexQuoteResponse,
  ErrorResponse,
  LiquidationResponse,
} from './types';

/**
 * Register mevdetails routes
 */
export function registerMevDetailsRoutes(app: Express) {
  app.get('/api/mev/atomic', async (
    req: Request,
    res: Response<AtomicArbResponse | ErrorResponse>
  ) => {
    try {
      const txHash = req.query.tx_hash as string;
    
      if (!txHash) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'tx_hash query parameter is required',
        });
        return;
      }

      // Validate tx_hash is a valid hex string (0x prefix optional)
      const hexPattern = /^(0x)?[0-9a-fA-F]{64}$/;
      if (!hexPattern.test(txHash)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'tx_hash must be a valid 64-character hexadecimal string',
        });
        return;
      }

      const query = `
        SELECT 
          tx_hash,
          block_number,
          trigger_tx,
          swaps.trace_idx,
          swaps.from,
          swaps.recipient,
          swaps.pool,
          swaps.token_in,
          swaps.token_out,
          swaps.amount_in,
          swaps.amount_out,
          gas_details.coinbase_transfer,
          gas_details.priority_fee,
          gas_details.gas_used,
          gas_details.effective_gas_price,
          arb_type,
          run_id,
          profit_usd,
          protocols
        FROM mev.atomic_arbs
        WHERE tx_hash = {txHash:String}
        LIMIT 1
      `;

      const result = await req.clickhouse.query({
        query,
        query_params: { txHash },
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        tx_hash: string;
        block_number: number;
        trigger_tx: string;
        'swaps.trace_idx': number[];
        'swaps.from': string[];
        'swaps.recipient': string[];
        'swaps.pool': string[];
        'swaps.token_in': Array<[string, string]>;
        'swaps.token_out': Array<[string, string]>;
        'swaps.amount_in': Array<[string, string]>;
        'swaps.amount_out': Array<[string, string]>;
        'gas_details.coinbase_transfer': string | null;
        'gas_details.priority_fee': string;
        'gas_details.gas_used': string;
        'gas_details.effective_gas_price': string;
        arb_type: string;
        run_id: number;
        profit_usd: number;
        protocols: string[];
      }>>();

      if (data.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: `Atomic arbitrage with tx_hash ${txHash} not found`,
        });
        return;
      }

      const row = data[0];
    
      // Transform nested swaps array
      const swaps: Array<{
        trace_idx: number;
        from: string;
        recipient: string;
        pool: string;
        token_in: [string, string];
        token_out: [string, string];
        amount_in: [string, string];
        amount_out: [string, string];
      }> = [];
    
      if (row['swaps.trace_idx'] && row['swaps.trace_idx'].length > 0) {
        for (let i = 0; i < row['swaps.trace_idx'].length; i++) {
          swaps.push({
            trace_idx: row['swaps.trace_idx'][i],
            from: row['swaps.from'][i] || '',
            recipient: row['swaps.recipient'][i] || '',
            pool: row['swaps.pool'][i] || '',
            token_in: row['swaps.token_in'][i] || ['', ''],
            token_out: row['swaps.token_out'][i] || ['', ''],
            amount_in: row['swaps.amount_in'][i] || ['', ''],
            amount_out: row['swaps.amount_out'][i] || ['', ''],
          });
        }
      }

      const response: AtomicArbResponse = {
        tx_hash: row.tx_hash,
        block_number: row.block_number,
        trigger_tx: row.trigger_tx,
        swaps,
        gas_details: {
          coinbase_transfer: row['gas_details.coinbase_transfer'],
          priority_fee: row['gas_details.priority_fee'],
          gas_used: row['gas_details.gas_used'],
          effective_gas_price: row['gas_details.effective_gas_price'],
        },
        arb_type: row.arb_type,
        run_id: row.run_id,
        profit_usd: row.profit_usd,
        protocols: row.protocols || [],
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching atomic arbitrage:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch atomic arbitrage',
      });
    }
  });

  // Get CexDex quotes by tx_hash
  app.get('/api/mev/cexdex', async (
    req: Request,
    res: Response<CexDexQuoteResponse | ErrorResponse>
  ) => {
    try {
      const txHash = req.query.tx_hash as string;
    
      if (!txHash) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'tx_hash query parameter is required',
        });
        return;
      }

      // Validate tx_hash is a valid hex string (0x prefix optional)
      const hexPattern = /^(0x)?[0-9a-fA-F]{64}$/;
      if (!hexPattern.test(txHash)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'tx_hash must be a valid 64-character hexadecimal string',
        });
        return;
      }

      const query = `
        SELECT 
          tx_hash,
          block_timestamp,
          block_number,
          swaps.trace_idx,
          swaps.from,
          swaps.recipient,
          swaps.pool,
          swaps.token_in,
          swaps.token_out,
          swaps.amount_in,
          swaps.amount_out,
          instant_mid_price,
          t2_mid_price,
          t12_mid_price,
          t30_mid_price,
          t60_mid_price,
          t300_mid_price,
          exchange,
          pnl,
          gas_details.coinbase_transfer,
          gas_details.priority_fee,
          gas_details.gas_used,
          gas_details.effective_gas_price,
          run_id,
          profit_usd,
          protocols
        FROM mev.cex_dex_quotes
        WHERE tx_hash = {txHash:String}
        LIMIT 1
      `;

      const result = await req.clickhouse.query({
        query,
        query_params: { txHash },
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        tx_hash: string;
        block_timestamp: number;
        block_number: number;
        'swaps.trace_idx': number[];
        'swaps.from': string[];
        'swaps.recipient': string[];
        'swaps.pool': string[];
        'swaps.token_in': Array<[string, string]>;
        'swaps.token_out': Array<[string, string]>;
        'swaps.amount_in': Array<[string, string]>;
        'swaps.amount_out': Array<[string, string]>;
        instant_mid_price: number[];
        t2_mid_price: number[];
        t12_mid_price: number[];
        t30_mid_price: number[];
        t60_mid_price: number[];
        t300_mid_price: number[];
        exchange: string;
        pnl: number;
        'gas_details.coinbase_transfer': string | null;
        'gas_details.priority_fee': string;
        'gas_details.gas_used': string;
        'gas_details.effective_gas_price': string;
        run_id: number;
        profit_usd: number;
        protocols: string[];
      }>>();

      if (data.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: `CexDex quote with tx_hash ${txHash} not found`,
        });
        return;
      }

      const row = data[0];
    
      // Transform nested swaps array
      const swaps: Array<{
        trace_idx: number;
        from: string;
        recipient: string;
        pool: string;
        token_in: [string, string];
        token_out: [string, string];
        amount_in: [string, string];
        amount_out: [string, string];
      }> = [];
    
      if (row['swaps.trace_idx'] && row['swaps.trace_idx'].length > 0) {
        for (let i = 0; i < row['swaps.trace_idx'].length; i++) {
          swaps.push({
            trace_idx: row['swaps.trace_idx'][i],
            from: row['swaps.from'][i] || '',
            recipient: row['swaps.recipient'][i] || '',
            pool: row['swaps.pool'][i] || '',
            token_in: row['swaps.token_in'][i] || ['', ''],
            token_out: row['swaps.token_out'][i] || ['', ''],
            amount_in: row['swaps.amount_in'][i] || ['', ''],
            amount_out: row['swaps.amount_out'][i] || ['', ''],
          });
        }
      }

      const response: CexDexQuoteResponse = {
        tx_hash: row.tx_hash,
        block_timestamp: row.block_timestamp,
        block_number: row.block_number,
        swaps,
        instant_mid_price: row.instant_mid_price || [],
        t2_mid_price: row.t2_mid_price || [],
        t12_mid_price: row.t12_mid_price || [],
        t30_mid_price: row.t30_mid_price || [],
        t60_mid_price: row.t60_mid_price || [],
        t300_mid_price: row.t300_mid_price || [],
        exchange: row.exchange,
        pnl: row.pnl,
        gas_details: {
          coinbase_transfer: row['gas_details.coinbase_transfer'],
          priority_fee: row['gas_details.priority_fee'],
          gas_used: row['gas_details.gas_used'],
          effective_gas_price: row['gas_details.effective_gas_price'],
        },
        run_id: row.run_id,
        profit_usd: row.profit_usd,
        protocols: row.protocols || [],
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching CexDex quote:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch CexDex quote',
      });
    }
  });

  // Get liquidations by tx_hash
  app.get('/api/mev/liquidations', async (
    req: Request,
    res: Response<LiquidationResponse | ErrorResponse>
  ) => {
    try {
      const txHash = req.query.tx_hash as string;
    
      if (!txHash) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'tx_hash query parameter is required',
        });
        return;
      }

      // Validate tx_hash is a valid hex string (0x prefix optional)
      const hexPattern = /^(0x)?[0-9a-fA-F]{64}$/;
      if (!hexPattern.test(txHash)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'tx_hash must be a valid 64-character hexadecimal string',
        });
        return;
      }

      const query = `
        SELECT 
          liquidation_tx_hash,
          block_number,
          liquidation_swaps.trace_idx,
          liquidation_swaps.from,
          liquidation_swaps.recipient,
          liquidation_swaps.pool,
          liquidation_swaps.token_in,
          liquidation_swaps.token_out,
          liquidation_swaps.amount_in,
          liquidation_swaps.amount_out,
          liquidations.trace_idx as liquidations_trace_idx,
          liquidations.pool as liquidations_pool,
          liquidations.liquidator,
          liquidations.debtor,
          liquidations.collateral_asset,
          liquidations.debt_asset,
          liquidations.covered_debt,
          liquidations.liquidated_collateral,
          gas_details.coinbase_transfer,
          gas_details.priority_fee,
          gas_details.gas_used,
          gas_details.effective_gas_price,
          run_id,
          profit_usd,
          protocols
        FROM mev.liquidations
        WHERE liquidation_tx_hash = {txHash:String}
        LIMIT 1
      `;

      const result = await req.clickhouse.query({
        query,
        query_params: { txHash },
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        liquidation_tx_hash: string;
        block_number: number;
        'liquidation_swaps.trace_idx': number[];
        'liquidation_swaps.from': string[];
        'liquidation_swaps.recipient': string[];
        'liquidation_swaps.pool': string[];
        'liquidation_swaps.token_in': Array<[string, string]>;
        'liquidation_swaps.token_out': Array<[string, string]>;
        'liquidation_swaps.amount_in': Array<[string, string]>;
        'liquidation_swaps.amount_out': Array<[string, string]>;
        liquidations_trace_idx: number[];
        liquidations_pool: string[];
        'liquidations.liquidator': string[];
        'liquidations.debtor': string[];
        'liquidations.collateral_asset': Array<[string, string]>;
        'liquidations.debt_asset': Array<[string, string]>;
        'liquidations.covered_debt': Array<[string, string]>;
        'liquidations.liquidated_collateral': Array<[string, string]>;
        'gas_details.coinbase_transfer': string | null;
        'gas_details.priority_fee': string;
        'gas_details.gas_used': string;
        'gas_details.effective_gas_price': string;
        run_id: number;
        profit_usd: number;
        protocols: string[];
      }>>();

      if (data.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: `Liquidation with tx_hash ${txHash} not found`,
        });
        return;
      }

      const row = data[0];
    
      // Transform nested liquidation_swaps array
      const liquidationSwaps: Array<{
        trace_idx: number;
        from: string;
        recipient: string;
        pool: string;
        token_in: [string, string];
        token_out: [string, string];
        amount_in: [string, string];
        amount_out: [string, string];
      }> = [];
    
      if (row['liquidation_swaps.trace_idx'] && row['liquidation_swaps.trace_idx'].length > 0) {
        for (let i = 0; i < row['liquidation_swaps.trace_idx'].length; i++) {
          liquidationSwaps.push({
            trace_idx: row['liquidation_swaps.trace_idx'][i],
            from: row['liquidation_swaps.from'][i] || '',
            recipient: row['liquidation_swaps.recipient'][i] || '',
            pool: row['liquidation_swaps.pool'][i] || '',
            token_in: row['liquidation_swaps.token_in'][i] || ['', ''],
            token_out: row['liquidation_swaps.token_out'][i] || ['', ''],
            amount_in: row['liquidation_swaps.amount_in'][i] || ['', ''],
            amount_out: row['liquidation_swaps.amount_out'][i] || ['', ''],
          });
        }
      }

      // Transform nested liquidations array
      const liquidations: Array<{
        trace_idx: number;
        pool: string;
        liquidator: string;
        debtor: string;
        collateral_asset: [string, string];
        debt_asset: [string, string];
        covered_debt: [string, string];
        liquidated_collateral: [string, string];
      }> = [];
    
      if (row.liquidations_trace_idx && row.liquidations_trace_idx.length > 0) {
        for (let i = 0; i < row.liquidations_trace_idx.length; i++) {
          liquidations.push({
            trace_idx: row.liquidations_trace_idx[i],
            pool: row.liquidations_pool[i] || '',
            liquidator: row['liquidations.liquidator'][i] || '',
            debtor: row['liquidations.debtor'][i] || '',
            collateral_asset: row['liquidations.collateral_asset'][i] || ['', ''],
            debt_asset: row['liquidations.debt_asset'][i] || ['', ''],
            covered_debt: row['liquidations.covered_debt'][i] || ['', ''],
            liquidated_collateral: row['liquidations.liquidated_collateral'][i] || ['', ''],
          });
        }
      }

      const response: LiquidationResponse = {
        liquidation_tx_hash: row.liquidation_tx_hash,
        block_number: row.block_number,
        liquidation_swaps: liquidationSwaps,
        liquidations,
        gas_details: {
          coinbase_transfer: row['gas_details.coinbase_transfer'],
          priority_fee: row['gas_details.priority_fee'],
          gas_used: row['gas_details.gas_used'],
          effective_gas_price: row['gas_details.effective_gas_price'],
        },
        run_id: row.run_id,
        profit_usd: row.profit_usd,
        protocols: row.protocols || [],
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching liquidation:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch liquidation',
      });
    }
  });


}