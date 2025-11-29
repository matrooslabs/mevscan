import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ClickHouseClient } from '@clickhouse/client';
import { minuteCacheMiddleware, cleanupExpiredCache } from './middleware/cache';
import { getGrossMEV } from './services/grossMEVService';
import { initClickHouseClient, type ClickHouseConfig } from '@mevscan/shared/clickhouse';
import { TIME_RANGES } from '@mevscan/shared/constants';
import type {
  Transaction,
  Block,
  BlockListItem,
  Address,
  MEVTransaction,
  AddressStatistics,
  PaginatedMEVTransactions,
  PaginationInfo,
  ErrorResponse,
  HealthResponse,
  RootResponse,
  TimeSeriesResponse,
  TimeSeriesDataPoint,
  TimeSeriesByProtocolResponse,
  TimeSeriesByProtocolDataPoint,
  PieChartResponse,
  TimeSeriesPercentageResponse,
  TimeSeriesPercentageDataPoint,
  ExpressLaneNetProfitResponse,
  ExpressLaneNetProfitDataPoint,
  ExpressLaneProfitByControllerResponse,
  ExpressLaneProfitByControllerDataPoint,
  TimeboostRevenueResponse,
  BidsPerAddressResponse,
  AuctionWinCountResponse,
  TimeboostedTxPerSecondResponse,
  TimeboostedTxPerBlockResponse,
  BidsPerRoundResponse,
  ExpressLanePriceResponse,
  BlockBundle,
  BalanceDelta,
  TokenDelta,
  AtomicArbResponse,
  CexDexQuoteResponse,
  LiquidationResponse,
}  from '@mevscan/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate client IP (useful when behind nginx, load balancer, etc.)
app.set('trust proxy', true);

// Initialize ClickHouse client once
let clickhouseClient: ClickHouseClient | null = null;

// Initialize ClickHouse client at startup - exit if configuration is invalid
try {
  const clickHouseConfig: ClickHouseConfig = {
    url: process.env.CLICKHOUSE_URL || '',
    username: process.env.CLICKHOUSE_USERNAME || '',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    database: process.env.CLICKHOUSE_DATABASE || '',
  };
  clickhouseClient = initClickHouseClient(clickHouseConfig);
  console.log('✓ ClickHouse client initialized successfully');
} catch (error) {
  console.error('ERROR: Failed to initialize ClickHouse client:', error);
  process.exit(1);
}

// Middleware to inject ClickHouse client into request context
declare global {
  namespace Express {
    interface Request {
      clickhouse: ClickHouseClient;
    }
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  // Client is guaranteed to be initialized at this point
  req.clickhouse = clickhouseClient!;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware (after express.json() to capture request body)
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  // Build parameter string
  const params: string[] = [];

  // Query parameters
  const queryParams = Object.keys(req.query);
  if (queryParams.length > 0) {
    params.push(`query: ${JSON.stringify(req.query)}`);
  }

  // URL parameters (available after routing, but logged here for consistency)
  const urlParams = Object.keys(req.params);
  if (urlParams.length > 0) {
    params.push(`params: ${JSON.stringify(req.params)}`);
  }

  // Request body (for POST/PUT/PATCH)
  if (req.body && Object.keys(req.body).length > 0 && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    params.push(`body: ${JSON.stringify(req.body)}`);
  }

  const paramString = params.length > 0 ? ` | ${params.join(' | ')}` : '';

  console.log(`[${timestamp}] ${req.method} ${req.path}${paramString} - IP: ${clientIP}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(
      `[${timestamp}] ${req.method} ${req.path}${paramString} - ${statusColor}${res.statusCode}${resetColor} - ${duration}ms - ${clientIP}`
    );
  });

  next();
});

// Caching middleware - cache responses for the current minute
// Cache is automatically flushed when entering a new minute
app.use(minuteCacheMiddleware);

// Periodic cache cleanup (every 5 minutes)
setInterval(() => {
  cleanupExpiredCache();
}, 5 * 60 * 1000);

// Helper function to format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return `${diff} secs ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// Helper function to format ETH value
function formatEthValue(wei: string | number): string {
  const value = typeof wei === 'string' ? BigInt(wei) : BigInt(wei);
  const eth = Number(value) / 1e18;
  return eth.toFixed(5);
}

// Helper function to convert timeRange string to ClickHouse interval
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

// Helper function to convert timeRange string to ClickHouse interval for timestamp column
function getTimestampTimeRangeFilter(timeRange: string): string {
  const range = timeRange || '15min';

  if (!TIME_RANGES.includes(range)) {
    throw new Error(`Invalid timeRange. Must be one of: ${TIME_RANGES.join(', ')}`);
  }

  switch (range) {
    case '5min':
      return `timestamp >= now() - INTERVAL 5 MINUTE`;
    case '15min':
      return `timestamp >= now() - INTERVAL 15 MINUTE`;
    case '30min':
      return `timestamp >= now() - INTERVAL 30 MINUTE`;
    case '1hour':
      return `timestamp >= now() - INTERVAL 1 HOUR`;
    case '12hours':
      return `timestamp >= now() - INTERVAL 12 HOUR`;
    default:
      return `timestamp >= now() - INTERVAL 15 MINUTE`;
  }
}

// Routes

// Get latest transactions
app.get('/api/latest-transactions', async (
  req: Request,
  res: Response<Transaction[] | ErrorResponse>
) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

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
    const limit = parseInt(req.query.limit as string) || 20;

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

// Get a specific block by block number
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
      WHERE mb.block_number = ${blockNum}
      ORDER BY bh.tx_index ASC
    `;

    const result = await req.clickhouse.query({
      query,
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
        WHERE block_number = ${blockNum} AND valid = 1
        LIMIT 1
      `;
      const timestampResult = await req.clickhouse.query({
        query: timestampQuery,
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
      WHERE bh.tx_hash = '${transactionId}'
      LIMIT 1
    `;

    const result = await req.clickhouse.query({
      query,
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
    const pageSize = Math.min(100, Math.max(10, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    // First, check if address is a contract by looking at mev_contract column
    // Also check if it appears as an EOA
    const contractCheckQuery = `
      SELECT 
        mev_contract,
        eoa
      FROM mev.bundle_header
      WHERE (lower(mev_contract) = '${normalizedAddress}' OR lower(eoa) = '${normalizedAddress}')
      LIMIT 1
    `;

    const contractCheckResult = await req.clickhouse.query({
      query: contractCheckQuery,
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
      ? `SELECT count() as total FROM mev.bundle_header WHERE lower(mev_contract) = '${normalizedAddress}'`
      : `SELECT count() as total FROM mev.bundle_header WHERE lower(eoa) = '${normalizedAddress}'`;

    const countResult = await req.clickhouse.query({
      query: countQuery,
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
        WHERE lower(mev_contract) = '${normalizedAddress}'
        ORDER BY block_number DESC, tx_index DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;

      const contractResult = await req.clickhouse.query({
        query: contractQuery,
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
        WHERE lower(eoa) = '${normalizedAddress}'
        ORDER BY block_number DESC, tx_index DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;

      const eoaResult = await req.clickhouse.query({
        query: eoaQuery,
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
        WHERE lower(mev_contract) = '${normalizedAddress}'
      `
      : `
        SELECT 
          sum(profit_usd) as total_profit,
          sum(bribe_usd) as total_bribe,
          countIf(timeboosted = true) as timeboosted_count
        FROM mev.bundle_header
        WHERE lower(eoa) = '${normalizedAddress}'
      `;

    const overallStatsResult = await req.clickhouse.query({
      query: overallStatsQuery,
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
        WHERE lower(mev_contract) = '${normalizedAddress}'
        GROUP BY mev_type
      `
      : `
        SELECT 
          mev_type,
          count() as mev_type_count
        FROM mev.bundle_header
        WHERE lower(eoa) = '${normalizedAddress}'
        GROUP BY mev_type
      `;

    const mevTypeResult = await req.clickhouse.query({
      query: mevTypeQuery,
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
          WHERE lower(mev_contract) = '${normalizedAddress}'
        `
        : `
          SELECT 
            min(block_number) as min_block,
            max(block_number) as max_block
          FROM mev.bundle_header
          WHERE lower(eoa) = '${normalizedAddress}'
        `;

      try {
        const blockRangeResult = await req.clickhouse.query({
          query: timestampQuery,
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
            WHERE block_number >= ${minBlock} AND block_number <= ${maxBlock} AND valid = 1
          `;
          const timestampResult = await req.clickhouse.query({
            query: timestampQuery2,
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
app.get('/api/gross-mev', async (
  req: Request,
  res: Response<TimeSeriesResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
    const response = await getGrossMEV(req.clickhouse, timeRange);
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
    const timeRange = (req.query.timeRange as string) || '15min';
    const timeFilter = getTimeRangeFilter(timeRange);

    const query = `
      SELECT
        toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) as time,
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
    const timeRange = (req.query.timeRange as string) || '15min';
    const timeFilter = getTimeRangeFilter(timeRange);

    const query = `
      SELECT
        toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) AS time,
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
    const timeRange = (req.query.timeRange as string) || '15min';
    const timeFilter = getTimeRangeFilter(timeRange);

    const query = `
      SELECT
        toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) AS time,
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

// Get Atomic MEV Timeboosted time series by protocol
app.get('/api/protocols/atomic-mev/timeboosted', async (
  req: Request,
  res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
    const timeFilter = getTimeRangeFilter(timeRange);

    const query = `
SELECT
  toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) AS time,
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

    const response: TimeSeriesByProtocolResponse = data
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
          proto: row.proto || '',
          profit_usd: row.profit_usd || 0,
        };
      })
      .filter((item): item is TimeSeriesByProtocolDataPoint => item !== null);

    res.json(response);
  } catch (error) {
    console.error('Error fetching Atomic MEV Timeboosted:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Atomic MEV Timeboosted',
    });
  }
});

// Get Atomic Arb MEV time series by protocol
app.get('/api/protocols/atomic-mev', async (
  req: Request,
  res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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
            toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) AS time,
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

    const response: TimeSeriesByProtocolResponse = data
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
          proto: row.proto || '',
          profit_usd: row.profit_usd || 0,
        };
      })
      .filter((item): item is TimeSeriesByProtocolDataPoint => item !== null);

    res.json(response);
  } catch (error) {
    console.error('Error fetching Atomic Arb MEV:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Atomic Arb MEV',
    });
  }
});

// Get CexDex Arb time series by protocol
app.get('/api/protocols/cexdex', async (
  req: Request,
  res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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
            toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) AS time,
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

    const response: TimeSeriesByProtocolResponse = data
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
          proto: row.proto || '',
          profit_usd: row.profit_usd || 0,
        };
      })
      .filter((item): item is TimeSeriesByProtocolDataPoint => item !== null);

    res.json(response);
  } catch (error) {
    console.error('Error fetching CexDex Arb:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch CexDex Arb',
    });
  }
});

// Get CexDex MEV Timeboosted time series by protocol
app.get('/api/protocols/cexdex/timeboosted', async (
  req: Request,
  res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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
            toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) AS time,
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

    const response: TimeSeriesByProtocolResponse = data
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
          proto: row.proto || '',
          profit_usd: row.profit_usd || 0,
        };
      })
      .filter((item): item is TimeSeriesByProtocolDataPoint => item !== null);

    res.json(response);
  } catch (error) {
    console.error('Error fetching CexDex MEV Timeboosted:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch CexDex MEV Timeboosted',
    });
  }
});

// Get Liquidation time series by protocol
app.get('/api/protocols/liquidation', async (
  req: Request,
  res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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
            toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) AS time,
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

    const response: TimeSeriesByProtocolResponse = data
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
          proto: row.proto || '',
          profit_usd: row.profit_usd || 0,
        };
      })
      .filter((item): item is TimeSeriesByProtocolDataPoint => item !== null);

    res.json(response);
  } catch (error) {
    console.error('Error fetching Liquidation:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Liquidation',
    });
  }
});

// Get Liquidation Timeboosted time series by protocol
app.get('/api/protocols/liquidation/timeboosted', async (
  req: Request,
  res: Response<TimeSeriesByProtocolResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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
            toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) AS time,
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

    const response: TimeSeriesByProtocolResponse = data
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
          proto: row.proto || '',
          profit_usd: row.profit_usd || 0,
        };
      })
      .filter((item): item is TimeSeriesByProtocolDataPoint => item !== null);

    res.json(response);
  } catch (error) {
    console.error('Error fetching Liquidation Timeboosted:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Liquidation Timeboosted',
    });
  }
});

// Get Express Lane MEV Percentage
app.get('/api/express-lane/mev-percentage', async (
  req: Request,
  res: Response<PieChartResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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
    console.error('Error fetching Express Lane MEV Percentage:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Express Lane MEV Percentage',
    });
  }
});

// Get Express Lane MEV Percentage per minute time series
app.get('/api/express-lane/mev-percentage-per-minute', async (
  req: Request,
  res: Response<TimeSeriesPercentageResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
    const timeFilter = getTimeRangeFilter(timeRange);

    const query = `
      SELECT
        toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) AS time,
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

    const response: TimeSeriesPercentageResponse = data
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
          timeboost: row.timeboost || 0,
          percentage: row.percentage || 0,
        };
      })
      .filter((item): item is TimeSeriesPercentageDataPoint => item !== null);

    res.json(response);
  } catch (error) {
    console.error('Error fetching Express Lane MEV Percentage per minute:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Express Lane MEV Percentage per minute',
    });
  }
});

// Get Express Lane Net Profit
app.get('/api/express-lane/net-profit', async (
  req: Request,
  res: Response<ExpressLaneNetProfitResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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
    console.error('Error fetching Express Lane Net Profit:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Express Lane Net Profit',
    });
  }
});

// Get Express Lane Profit by Controller
app.get('/api/express-lane/profit-by-controller', async (
  req: Request,
  res: Response<ExpressLaneProfitByControllerResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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
    console.error('Error fetching Express Lane Profit by Controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Express Lane Profit by Controller',
    });
  }
});

// Get Timeboost Gross Revenue (all-time, no timeRange)
app.get('/api/timeboost/gross-revenue', async (
  req: Request,
  res: Response<TimeboostRevenueResponse | ErrorResponse>
) => {
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

    const data = await result.json<Array<{
      total_first_price: number;
      total_second_price: number;
    }>>();

    const response: TimeboostRevenueResponse = data.length > 0 ? {
      total_first_price: data[0].total_first_price || 0,
      total_second_price: data[0].total_second_price || 0,
    } : {
      total_first_price: 0,
      total_second_price: 0,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching Timeboost Gross Revenue:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Timeboost Gross Revenue',
    });
  }
});

// Get Timeboost Revenue (time-ranged)
app.get('/api/timeboost/revenue', async (
  req: Request,
  res: Response<TimeboostRevenueResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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

    const data = await result.json<Array<{
      total_first_price: number;
      total_second_price: number;
    }>>();

    const response: TimeboostRevenueResponse = data.length > 0 ? {
      total_first_price: data[0].total_first_price || 0,
      total_second_price: data[0].total_second_price || 0,
    } : {
      total_first_price: 0,
      total_second_price: 0,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching Timeboost Revenue:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Timeboost Revenue',
    });
  }
});

// Get Bids per Address
app.get('/api/timeboost/bids-per-address', async (
  req: Request,
  res: Response<BidsPerAddressResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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

    const data = await result.json<Array<{
      bidder: string;
      bid_count: number;
    }>>();

    const response: BidsPerAddressResponse = data.map((row) => ({
      bidder: row.bidder || '',
      bid_count: row.bid_count || 0,
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching Bids per Address:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Bids per Address',
    });
  }
});

// Get Auction Win Count
app.get('/api/timeboost/auction-win-count', async (
  req: Request,
  res: Response<AuctionWinCountResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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

    const data = await result.json<Array<{
      address: string;
      wins: number;
    }>>();

    const response: AuctionWinCountResponse = data.map((row) => ({
      address: row.address || '',
      wins: row.wins || 0,
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching Auction Win Count:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Auction Win Count',
    });
  }
});

// Get Timeboosted Tx per Second
app.get('/api/timeboost/tx-per-second', async (
  req: Request,
  res: Response<TimeboostedTxPerSecondResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
    const timeFilter = getTimeRangeFilter(timeRange);

    const query = `
      SELECT
        toDateTime(e.block_timestamp) AS time,
        sum(m.timeboosted_tx_count) AS tx_count
      FROM mev.mev_blocks AS m
      INNER JOIN ethereum.blocks AS e
        ON m.block_number = e.block_number
      WHERE ${timeFilter}
      GROUP BY e.block_timestamp
      ORDER BY e.block_timestamp ASC
    `;

    const result = await req.clickhouse.query({
      query,
      format: 'JSONEachRow',
    });

    const data = await result.json<Array<{
      time: string;
      tx_count: number;
    }>>();

    const response: TimeboostedTxPerSecondResponse = data
      .filter((row) => row.time != null)
      .map((row) => {
        const date = new Date(row.time);
        if (isNaN(date.getTime())) {
          return null;
        }
        const hours = date.getHours().toString().padStart(2, '0');
        const mins = date.getMinutes().toString().padStart(2, '0');
        const secs = date.getSeconds().toString().padStart(2, '0');
        return {
          time: `${hours}:${mins}:${secs}`,
          tx_count: row.tx_count || 0,
        };
      })
      .filter((item): item is { time: string; tx_count: number } => item !== null);

    res.json(response);
  } catch (error) {
    console.error('Error fetching Timeboosted Tx per Second:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Timeboosted Tx per Second',
    });
  }
});

// Get Timeboosted Tx per Block
app.get('/api/timeboost/tx-per-block', async (
  req: Request,
  res: Response<TimeboostedTxPerBlockResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
    const timeFilter = getTimeRangeFilter(timeRange);

    const query = `
      SELECT
        e.block_number AS block_number,
        m.timeboosted_tx_count AS tx_count
      FROM mev.mev_blocks AS m
      INNER JOIN ethereum.blocks AS e
        ON m.block_number = e.block_number
      WHERE ${timeFilter}
      ORDER BY e.block_number ASC
    `;

    const result = await req.clickhouse.query({
      query,
      format: 'JSONEachRow',
    });

    const data = await result.json<Array<{
      block_number: number;
      tx_count: number;
    }>>();

    const response: TimeboostedTxPerBlockResponse = data.map((row) => ({
      block_number: row.block_number || 0,
      tx_count: row.tx_count || 0,
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching Timeboosted Tx per Block:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Timeboosted Tx per Block',
    });
  }
});

// Get Bids per Round
app.get('/api/timeboost/bids-per-round', async (
  req: Request,
  res: Response<BidsPerRoundResponse | ErrorResponse>
) => {
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

    const data = await result.json<Array<{
      round: number;
      bid_count: number;
    }>>();

    const response: BidsPerRoundResponse = data.map((row) => ({
      round: row.round || 0,
      bid_count: row.bid_count || 0,
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching Bids per Round:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Bids per Round',
    });
  }
});

// Get Express Lane Price
app.get('/api/timeboost/express-lane-price', async (
  req: Request,
  res: Response<ExpressLanePriceResponse | ErrorResponse>
) => {
  try {
    const timeRange = (req.query.timeRange as string) || '15min';
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
      ORDER BY round DESC
    `;

    const result = await req.clickhouse.query({
      query,
      format: 'JSONEachRow',
    });

    const data = await result.json<Array<{
      round: number;
      first_price: number;
      winner: string;
      second_price: number;
      second_place: string;
    }>>();

    const response: ExpressLanePriceResponse = data.map((row) => ({
      round: row.round || 0,
      first_price: row.first_price || 0,
      winner: row.winner || '',
      second_price: row.second_price || 0,
      second_place: row.second_place || '',
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching Express Lane Price:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Express Lane Price',
    });
  }
});

// Get atomic arbitrage by tx_hash
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
      WHERE tx_hash = '${txHash}'
      LIMIT 1
    `;

    const result = await req.clickhouse.query({
      query,
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
      WHERE tx_hash = '${txHash}'
      LIMIT 1
    `;

    const result = await req.clickhouse.query({
      query,
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
      WHERE liquidation_tx_hash = '${txHash}'
      LIMIT 1
    `;

    const result = await req.clickhouse.query({
      query,
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

// Health check endpoint
app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req: Request, res: Response<RootResponse>) => {
  res.json({
    message: 'MEVScan API Server',
    version: '1.0.0',
    endpoints: [
      'GET /api/latest-transactions',
      'GET /api/latest-blocks',
      'GET /api/blocks/:blockNumber',
      'GET /api/transactions/:transactionId',
      'GET /api/addresses/:address',
      'GET /api/gross-mev?timeRange=15min',
      'GET /api/gross-atomic-arb?timeRange=15min',
      'GET /api/gross-cex-dex-quotes?timeRange=15min',
      'GET /api/gross-liquidation?timeRange=15min',
      'GET /api/protocols/atomic-mev/timeboosted?timeRange=15min',
      'GET /api/express-lane/mev-percentage?timeRange=15min',
      'GET /api/express-lane/mev-percentage-per-minute?timeRange=15min',
      'GET /api/express-lane/net-profit?timeRange=15min',
      'GET /api/express-lane/profit-by-controller?timeRange=15min',
      'GET /api/timeboost/gross-revenue',
      'GET /api/timeboost/revenue?timeRange=15min',
      'GET /api/timeboost/bids-per-address?timeRange=15min',
      'GET /api/timeboost/auction-win-count?timeRange=15min',
      'GET /api/timeboost/tx-per-second?timeRange=15min',
      'GET /api/timeboost/tx-per-block?timeRange=15min',
      'GET /api/timeboost/bids-per-round',
      'GET /api/timeboost/express-lane-price?timeRange=15min',
      'GET /api/mev/atomic?tx_hash=<tx_hash>',
      'GET /api/mev/cexdex?tx_hash=<tx_hash>',
      'GET /api/mev/liquidations?tx_hash=<tx_hash>',
      'GET /health'
    ]
  });
});

// Error handling middleware
app.use((
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use((req: Request, res: Response<ErrorResponse>) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}`);
});

