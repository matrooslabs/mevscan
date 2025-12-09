import type { Express } from 'express';
import {
  Request,
  Response,
  Address,
  AddressStatistics,
  BalanceDelta,
  Block,
  ErrorResponse,
  MEVTransaction,
  PaginatedMEVTransactions,
  PaginationInfo,
  TokenDelta,
  Transaction,
} from './types';
import {
  formatRelativeTime,
  formatEthValue,
  getTimeRangeFilter,
  getTimestampTimeRangeFilter,
} from './types';
import { DEFAULTS } from '../constants';

/**
 * Register entities routes
 */
export function registerEntitiesRoutes(app: Express) {
  app.get('/api/blocks/:blockNumber', async (
    req: Request<{ blockNumber: string }>,
    res: Response<Block | ErrorResponse>
  ) => {
    try {
      const { blockNumber } = req.params;
    
      // Validate block number is numeric
      if (!/^\d+$/.test(blockNumber)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Block number must be a numeric value',
        });
        return;
      }

      const blockNum = parseInt(blockNumber, 10);
    
      // Query joining mev.mev_blocks and mev.bundle_header
      // Focus on PnL and MEV types for each bundle
      const query = `
        SELECT 
          bh.tx_hash as tx_hash,
          bh.tx_index as tx_index,
          mb.block_hash as block_hash,
          mb.block_number as block_number,
          mb.eth_price as eth_price,
          arraySum(mb.mev_count.mev_count) as mev_count,
          mb.total_mev_profit_usd as total_mev_profit_usd,
          mb.timeboosted_tx_count as timeboosted_tx_count,
          mb.timeboosted_tx_mev_count as timeboosted_tx_mev_count,
          mb.total_bribe as total_bribe,
          mb.total_mev_bribe as total_mev_bribe,
          bh.profit_usd as bundle_profit_usd,
          bh.bribe_usd as bundle_bribe_usd,
          bh.mev_type as mev_type,
          bh.mev_contract as mev_contract,
          bh.eoa as eoa,
          bh.timeboosted as timeboosted,
          bh.express_lane_controller as express_lane_controller,
          bh.express_lane_price_usd as express_lane_price_usd,
          bh.express_lane_round as express_lane_round
        FROM mev.mev_blocks mb 
        INNER JOIN mev.bundle_header bh 
          ON mb.block_number = bh.block_number 
        WHERE mb.block_number = {blockNum:UInt64}
        ORDER BY bh.tx_index ASC
      `;

      const result = await req.clickhouse.query({
        query,
        query_params: { blockNum },
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        tx_hash: string;
        tx_index: number;
        block_hash: string;
        block_number: number;
        eth_price: number;
        mev_count: number;
        total_mev_profit_usd: number;
        timeboosted_tx_count: number;
        timeboosted_tx_mev_count: number;
        total_bribe: string;
        total_mev_bribe: string;
        bundle_profit_usd: number;
        bundle_bribe_usd: number;
        mev_type: string;
        mev_contract: string | null;
        eoa: string;
        timeboosted: boolean;
        express_lane_controller: string | null;
        express_lane_price_usd: number | null;
        express_lane_round: number | null;
      }>>();

      if (data.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: `Block ${blockNumber} not found`,
        });
        return;
      }

      // Get block-level info from first row (all rows have same block info)
      const firstRow = data[0];
    
      // Extract bundles with PnL and MEV types
      const bundles = data.map(row => ({
        txHash: row.tx_hash,
        txIndex: row.tx_index,
        profitUsd: row.bundle_profit_usd,
        bribeUsd: row.bundle_bribe_usd,
        mevType: row.mev_type,
        mevContract: row.mev_contract,
        eoa: row.eoa,
        timeboosted: row.timeboosted,
        expressLaneController: row.express_lane_controller,
        expressLanePriceUsd: row.express_lane_price_usd,
        expressLaneRound: row.express_lane_round,
      }));

      // Get timestamp from ethereum.blocks if needed
      let blockTimestamp: number | null = null;
      try {
        const timestampQuery = `
          SELECT block_timestamp
          FROM ethereum.blocks
          WHERE block_number = {blockNum:UInt64} AND valid = 1
          LIMIT 1
        `;
        const timestampResult = await req.clickhouse.query({
          query: timestampQuery,
          query_params: { blockNum },
          format: 'JSONEachRow',
        });
        const timestampData = await timestampResult.json<Array<{ block_timestamp: number }>>();
        if (timestampData.length > 0) {
          blockTimestamp = timestampData[0].block_timestamp;
        }
      } catch (error) {
        console.warn('Could not fetch block timestamp:', error);
      }

      const block: Block = {
        number: firstRow.block_number,
        hash: firstRow.block_hash,
        timestamp: blockTimestamp ? formatRelativeTime(blockTimestamp) : undefined,
        miner: null,
        minerAddress: '0x0000000000000000000000000000000000000000',
        expressLaneTxns: firstRow.timeboosted_tx_count,
        totalTxns: bundles.length,
        timeTaken: '12 secs',
        ethValue: '0.00000', // Can be calculated from total_bribe if needed
        gasUsed: firstRow.total_bribe, // Using total_bribe as placeholder, adjust as needed
        totalMevProfitUsd: firstRow.total_mev_profit_usd,
        transactions: bundles.map(b => b.txHash),
        bundles: bundles,
      };

      res.json(block);
    } catch (error) {
      console.error('Error fetching block:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch block',
      });
    }
  });

  // Get a specific transaction by identifier
  app.get('/api/transactions/:transactionId', async (
    req: Request<{ transactionId: string }>, 
    res: Response<Transaction | ErrorResponse>
  ) => {
    try {
      const { transactionId } = req.params;
    
      // Query joins bundle_header and tree tables using PRIMARY KEY (block_number, tx_hash)
      const query = `
        SELECT 
          bh.tx_hash,
          t.from,
          t.to,
          bh.profit_usd,
          bh.bribe_usd,
          bh.mev_type,
          bh.mev_contract,
          bh.block_number,
          t.gas_details.priority_fee as priority_fee,
          t.gas_details.gas_used as gas_used,
          t.gas_details.effective_gas_price as effective_gas_price,
          bh.timeboosted,
          bh.express_lane_controller,
          bh.express_lane_price,
          bh.express_lane_round,
          bh.balance_deltas.tx_hash as balance_deltas_tx_hash,
          bh.balance_deltas.address as balance_deltas_address,
          bh.balance_deltas.name as balance_deltas_name,
          bh.balance_deltas.token_deltas as balance_deltas_token_deltas
        FROM mev.bundle_header bh
        INNER JOIN brontes.tree t ON bh.block_number = t.block_number AND bh.tx_hash = t.tx_hash
        WHERE bh.tx_hash = {transactionId:String}
        LIMIT 1
      `;

      const result = await req.clickhouse.query({
        query,
        query_params: { transactionId },
        format: 'JSONEachRow',
      });

      const data = await result.json<Array<{
        tx_hash: string;
        from: string;
        to: string | null;
        profit_usd: number;
        bribe_usd: number;
        mev_type: string;
        mev_contract: string | null;
        block_number: number;
        priority_fee: string;
        gas_used: string;
        effective_gas_price: string;
        timeboosted: boolean;
        express_lane_controller: string | null;
        express_lane_price: string | null;
        express_lane_round: number | null;
        balance_deltas_tx_hash: string[];
        balance_deltas_address: string[];
        balance_deltas_name: (string | null)[];
        balance_deltas_token_deltas: Array<Array<[string, number, string, number, number]>>;
      }>>();

      if (data.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: `Transaction ${transactionId} not found`,
        });
        return;
      }

      const row = data[0];
      const value = row.priority_fee 
        ? formatEthValue(row.priority_fee)
        : (row.profit_usd / 1e6).toFixed(5);

      // Parse balance_deltas from nested structure
      const balanceDeltas: BalanceDelta[] = [];
      if (row.balance_deltas_tx_hash && row.balance_deltas_tx_hash.length > 0) {
        for (let i = 0; i < row.balance_deltas_tx_hash.length; i++) {
          const tokenDeltas: TokenDelta[] = [];
        
          // Parse token_deltas array for this balance_delta entry
          // token_deltas is Array(Tuple(Tuple(String, UInt8, String), Float64, Float64))
          // In JSON: [[[address, decimals, symbol], delta, delta_usd], ...]
          if (row.balance_deltas_token_deltas && row.balance_deltas_token_deltas[i]) {
            const tokenDeltasArray = row.balance_deltas_token_deltas[i];
            if (Array.isArray(tokenDeltasArray)) {
              for (const tokenDelta of tokenDeltasArray) {
                // tokenDelta is a tuple: [[address, decimals, symbol], delta, delta_usd]
                if (Array.isArray(tokenDelta) && tokenDelta.length >= 3) {
                  const tokenInfo = tokenDelta[0]; // Nested tuple: [address, decimals, symbol]
                  let tokenAddress = '';
                  let decimals = 0;
                  let symbol = '';
                
                  if (Array.isArray(tokenInfo) && tokenInfo.length >= 2) {
                    tokenAddress = String(tokenInfo[0] || '');
                    decimals = Number(tokenInfo[1] || 0);
                    symbol = String(tokenInfo[2] || '');
                  } else {
                    // Fallback: if structure is different, try to extract from first 3 elements
                    tokenAddress = String(tokenDelta[0] || '');
                    decimals = Number(tokenDelta[1] || 0);
                    symbol = String(tokenDelta[2] || '');
                  }
                
                  const delta = Array.isArray(tokenInfo) ? Number(tokenDelta[1] || 0) : Number(tokenDelta[3] || 0);
                  const deltaUsd = Array.isArray(tokenInfo) ? Number(tokenDelta[2] || 0) : Number(tokenDelta[4] || 0);
                
                  tokenDeltas.push({
                    tokenAddress,
                    decimals,
                    symbol,
                    delta,
                    deltaUsd,
                  });
                }
              }
            }
          }
        
          balanceDeltas.push({
            txHash: row.balance_deltas_tx_hash[i] || '',
            address: row.balance_deltas_address[i] || '',
            name: row.balance_deltas_name[i] || null,
            tokenDeltas,
          });
        }
      }

      const transaction: Transaction = {
        hash: row.tx_hash,
        blockNumber: row.block_number,
        profit: row.profit_usd,
        mevType: row.mev_type,
        mevContract: row.mev_contract,
        timeboosted: row.timeboosted,
        expressLaneController: row.express_lane_controller,
        expressLanePrice: row.express_lane_price,
        expressLaneRound: row.express_lane_round,
        from: row.from.length > 14 
          ? `${row.from.slice(0, 10)}...${row.from.slice(-6)}`
          : row.from,
        to: row.to 
          ? (row.to.length > 14 
              ? `${row.to.slice(0, 10)}...${row.to.slice(-6)}`
              : row.to)
          : 'Contract Creation',
        toLabel: row.mev_type || null,
        value,
        time: 'Just now',
        gas: row.gas_used,
        gasPrice: row.effective_gas_price,
        status: 'success',
        balanceDeltas: balanceDeltas.length > 0 ? balanceDeltas : undefined,
      };

      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch transaction',
      });
    }
  });

  // Get a specific address by identifier
  app.get('/api/addresses/:address', async (
    req: Request<{ address: string }>, 
    res: Response<Address | ErrorResponse>
  ) => {
    try {
    const { address } = req.params;
      const normalizedAddress = address.toLowerCase();
    
      // Pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(
        DEFAULTS.PAGINATION.MAX_PAGE_SIZE,
        Math.max(
          DEFAULTS.PAGINATION.MIN_PAGE_SIZE,
          parseInt(req.query.pageSize as string) || DEFAULTS.PAGINATION.DEFAULT_PAGE_SIZE
        )
      );
      const offset = (page - 1) * pageSize;
    
      // First, check if address is a contract by looking at mev_contract column
      // Also check if it appears as an EOA
      const contractCheckQuery = `
        SELECT 
          mev_contract,
          eoa
        FROM mev.bundle_header
        WHERE (lower(mev_contract) = {normalizedAddress:String} OR lower(eoa) = {normalizedAddress:String})
        LIMIT 1
      `;
    
      const contractCheckResult = await req.clickhouse.query({
        query: contractCheckQuery,
        query_params: { normalizedAddress },
        format: 'JSONEachRow',
      });
    
      const contractCheckData = await contractCheckResult.json<Array<{
        mev_contract: string | null;
        eoa: string;
      }>>();
    
      const isContract = contractCheckData.length > 0 && 
                         contractCheckData[0].mev_contract !== null &&
                         contractCheckData[0].mev_contract.toLowerCase() === normalizedAddress;
    
      // Get total count for statistics and pagination
      const countQuery = isContract
        ? `SELECT count() as total FROM mev.bundle_header WHERE lower(mev_contract) = {normalizedAddress:String}`
        : `SELECT count() as total FROM mev.bundle_header WHERE lower(eoa) = {normalizedAddress:String}`;
    
      const countResult = await req.clickhouse.query({
        query: countQuery,
        query_params: { normalizedAddress },
        format: 'JSONEachRow',
      });
    
      const countData = await countResult.json<Array<{ total: number }>>();
      const totalCount = countData.length > 0 ? countData[0].total : 0;
    
      // Get paginated transactions
      let mevTransactions: MEVTransaction[] = [];
    
      if (isContract) {
        // For contracts: Get paginated transactions where mev_contract = address
        const contractQuery = `
          SELECT 
            tx_hash,
            block_number,
            tx_index,
            profit_usd,
            bribe_usd,
            mev_type,
            eoa,
            mev_contract,
            timeboosted,
            express_lane_controller,
            express_lane_price_usd,
            express_lane_round
          FROM mev.bundle_header
          WHERE lower(mev_contract) = {normalizedAddress:String}
          ORDER BY block_number DESC, tx_index DESC
          LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}
        `;
      
        const contractResult = await req.clickhouse.query({
          query: contractQuery,
          query_params: { normalizedAddress, pageSize, offset },
          format: 'JSONEachRow',
        });
      
        const contractData = await contractResult.json<Array<{
          tx_hash: string;
          block_number: number;
          tx_index: number;
          profit_usd: number;
          bribe_usd: number;
          mev_type: string;
          eoa: string;
          mev_contract: string | null;
          timeboosted: boolean;
          express_lane_controller: string | null;
          express_lane_price_usd: number | null;
          express_lane_round: number | null;
        }>>();
      
        mevTransactions = contractData.map(row => ({
          txHash: row.tx_hash,
          blockNumber: row.block_number,
          txIndex: row.tx_index,
          profitUsd: row.profit_usd,
          bribeUsd: row.bribe_usd,
          mevType: row.mev_type,
          mevContract: null, // For contracts, mevContract is null
          eoa: row.eoa,
          timeboosted: row.timeboosted,
          expressLaneController: row.express_lane_controller,
          expressLanePriceUsd: row.express_lane_price_usd,
          expressLaneRound: row.express_lane_round,
        }));
      
      } else {
        // For EOA: Get paginated bundle headers where eoa = address
        const eoaQuery = `
          SELECT 
            tx_hash,
            block_number,
            tx_index,
            profit_usd,
            bribe_usd,
            mev_type,
            mev_contract,
            eoa,
            timeboosted,
            express_lane_controller,
            express_lane_price_usd,
            express_lane_round
          FROM mev.bundle_header
          WHERE lower(eoa) = {normalizedAddress:String}
          ORDER BY block_number DESC, tx_index DESC
          LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}
        `;
      
        const eoaResult = await req.clickhouse.query({
          query: eoaQuery,
          query_params: { normalizedAddress, pageSize, offset },
          format: 'JSONEachRow',
        });
      
        const eoaData = await eoaResult.json<Array<{
          tx_hash: string;
          block_number: number;
          tx_index: number;
          profit_usd: number;
          bribe_usd: number;
          mev_type: string;
          mev_contract: string | null;
          eoa: string;
          timeboosted: boolean;
          express_lane_controller: string | null;
          express_lane_price_usd: number | null;
          express_lane_round: number | null;
        }>>();
      
        mevTransactions = eoaData.map(row => ({
          txHash: row.tx_hash,
          blockNumber: row.block_number,
          txIndex: row.tx_index,
          profitUsd: row.profit_usd,
          bribeUsd: row.bribe_usd,
          mevType: row.mev_type,
          mevContract: row.mev_contract,
          eoa: null, // For EOA, eoa is null
          timeboosted: row.timeboosted,
          expressLaneController: row.express_lane_controller,
          expressLanePriceUsd: row.express_lane_price_usd,
          expressLaneRound: row.express_lane_round,
        }));
      }
    
      // Get statistics from all transactions (not just current page)
      // First get overall stats
      const overallStatsQuery = isContract
        ? `
          SELECT 
            sum(profit_usd) as total_profit,
            sum(bribe_usd) as total_bribe,
            countIf(timeboosted = true) as timeboosted_count
          FROM mev.bundle_header
          WHERE lower(mev_contract) = {normalizedAddress:String}
        `
        : `
          SELECT 
            sum(profit_usd) as total_profit,
            sum(bribe_usd) as total_bribe,
            countIf(timeboosted = true) as timeboosted_count
          FROM mev.bundle_header
          WHERE lower(eoa) = {normalizedAddress:String}
        `;
    
      const overallStatsResult = await req.clickhouse.query({
        query: overallStatsQuery,
        query_params: { normalizedAddress },
        format: 'JSONEachRow',
      });
    
      const overallStatsData = await overallStatsResult.json<Array<{
        total_profit: number;
        total_bribe: number;
        timeboosted_count: number;
      }>>();
    
      // Get MEV type breakdown
      const mevTypeQuery = isContract
        ? `
          SELECT 
            mev_type,
            count() as mev_type_count
          FROM mev.bundle_header
          WHERE lower(mev_contract) = {normalizedAddress:String}
          GROUP BY mev_type
        `
        : `
          SELECT 
            mev_type,
            count() as mev_type_count
          FROM mev.bundle_header
          WHERE lower(eoa) = {normalizedAddress:String}
          GROUP BY mev_type
        `;
    
      const mevTypeResult = await req.clickhouse.query({
        query: mevTypeQuery,
        query_params: { normalizedAddress },
        format: 'JSONEachRow',
      });
    
      const mevTypeData = await mevTypeResult.json<Array<{
        mev_type: string;
        mev_type_count: number;
      }>>();
    
      const statistics: AddressStatistics = {
        totalProfitUsd: overallStatsData.length > 0 ? (overallStatsData[0].total_profit || 0) : 0,
        totalBribeUsd: overallStatsData.length > 0 ? (overallStatsData[0].total_bribe || 0) : 0,
        totalTransactions: totalCount,
        timeboostedCount: overallStatsData.length > 0 ? (overallStatsData[0].timeboosted_count || 0) : 0,
        mevTypeBreakdown: mevTypeData.reduce((acc, row) => {
          acc[row.mev_type] = row.mev_type_count;
          return acc;
        }, {} as Record<string, number>),
      };
    
      // Get first and last seen timestamps (from all transactions, not just current page)
      let firstSeen: string | undefined;
      let lastSeen: string | undefined;
    
      if (totalCount > 0) {
        const timestampQuery = isContract
          ? `
            SELECT 
              min(block_number) as min_block,
              max(block_number) as max_block
            FROM mev.bundle_header
            WHERE lower(mev_contract) = {normalizedAddress:String}
          `
          : `
            SELECT 
              min(block_number) as min_block,
              max(block_number) as max_block
            FROM mev.bundle_header
            WHERE lower(eoa) = {normalizedAddress:String}
          `;
      
        try {
          const blockRangeResult = await req.clickhouse.query({
            query: timestampQuery,
            query_params: { normalizedAddress },
            format: 'JSONEachRow',
          });
          const blockRangeData = await blockRangeResult.json<Array<{
            min_block: number;
            max_block: number;
          }>>();
        
          if (blockRangeData.length > 0 && blockRangeData[0].min_block && blockRangeData[0].max_block) {
            const minBlock = blockRangeData[0].min_block;
            const maxBlock = blockRangeData[0].max_block;
          
            const timestampQuery2 = `
              SELECT 
                min(block_timestamp) as first_seen,
                max(block_timestamp) as last_seen
              FROM ethereum.blocks
              WHERE block_number >= {minBlock:UInt64} AND block_number <= {maxBlock:UInt64} AND valid = 1
            `;
            const timestampResult = await req.clickhouse.query({
              query: timestampQuery2,
              query_params: { minBlock, maxBlock },
              format: 'JSONEachRow',
            });
            const timestampData = await timestampResult.json<Array<{
              first_seen: number | null;
              last_seen: number | null;
            }>>();
          
            if (timestampData.length > 0 && timestampData[0].first_seen) {
              firstSeen = formatRelativeTime(timestampData[0].first_seen);
            }
            if (timestampData.length > 0 && timestampData[0].last_seen) {
              lastSeen = formatRelativeTime(timestampData[0].last_seen);
            }
          }
        } catch (error) {
          console.warn('Could not fetch timestamps:', error);
        }
      }
    
      // Build pagination info
      const totalPages = Math.ceil(totalCount / pageSize);
      const pagination: PaginationInfo = {
        page,
        pageSize,
        total: totalCount,
        totalPages,
      };
    
      const paginatedTransactions: PaginatedMEVTransactions = {
        transactions: mevTransactions,
        pagination,
      };
    
    const addressData: Address = {
      address: address,
        balance: '0',
        balanceInEth: '0',
        ethBalance: '0',
        transactionCount: statistics.totalTransactions,
      code: null,
        isContract: isContract,
        transactions: mevTransactions.map(tx => tx.txHash),
        firstSeen: firstSeen,
        lastSeen: lastSeen,
        statistics: statistics,
        mevTransactions: paginatedTransactions,
    };
  
    res.json(addressData);
    } catch (error) {
      console.error('Error fetching address:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch address',
      });
    }
  });

  // Dashboard visualization endpoints

  // Get Gross MEV time series

}