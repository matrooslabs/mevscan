import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import type {
  Transaction,
  Block,
  BlockListItem,
  Address,
  ErrorResponse,
  HealthResponse,
  RootResponse,
  TimeSeriesResponse,
  TimeSeriesDataPoint,
  TimeSeriesByProtocolResponse,
  TimeSeriesByProtocolDataPoint,
  PieChartResponse,
} from '../shared/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate client IP (useful when behind nginx, load balancer, etc.)
app.set('trust proxy', true);

// Initialize ClickHouse client once
let clickhouseClient: ClickHouseClient | null = null;

function initClickHouseClient(): ClickHouseClient {
  const url = process.env.CLICKHOUSE_URL;
  const username = process.env.CLICKHOUSE_USERNAME;
  const password = process.env.CLICKHOUSE_PASSWORD;
  const database = process.env.CLICKHOUSE_DATABASE;

  // Validate all required environment variables are present
  if (!url) {
    console.error('ERROR: CLICKHOUSE_URL environment variable is required');
    process.exit(1);
  }
  if (!username) {
    console.error('ERROR: CLICKHOUSE_USERNAME environment variable is required');
    process.exit(1);
  }
  if (password === undefined) {
    console.error('ERROR: CLICKHOUSE_PASSWORD environment variable is required');
    process.exit(1);
  }
  if (!database) {
    console.error('ERROR: CLICKHOUSE_DATABASE environment variable is required');
    process.exit(1);
  }

  return createClient({
    host: url,
    username,
    password,
    database,
  });
}

// Initialize ClickHouse client at startup - exit if configuration is invalid
try {
  clickhouseClient = initClickHouseClient();
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
  const validRanges = ['5min', '15min', '30min', '1hour'];
  const range = timeRange || '15min';
  
  if (!validRanges.includes(range)) {
    throw new Error(`Invalid timeRange. Must be one of: ${validRanges.join(', ')}`);
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
    default:
      return `e.block_timestamp >= now() - INTERVAL 15 MINUTE`;
  }
}

// Routes

// Get latest transactions
app.get('/latest-transactions', async (
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
app.get('/latest-blocks', async (
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
        mev_count.mev_count as mev_count,
        total_mev_profit_usd as total_profit,
        timeboosted_tx_count,
        timeboosted_tx_mev_count
      FROM mev.mev_blocks
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
    }>>();

    // Map to BlockListItem type
    const blocks: BlockListItem[] = data.map((row) => ({
      hash: row.block_hash,
      number: row.block_number,
      mevCount: row.mev_count,
      totalProfit: row.total_profit,
      timeboostedTxCount: row.timeboosted_tx_count,
      timeboostedTxMevCount: row.timeboosted_tx_mev_count,
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

// Get a specific block by identifier (hash or number)
app.get('/blocks/:blockId', async (
  req: Request<{ blockId: string }>,
  res: Response<Block | ErrorResponse>
) => {
  try {
    const { blockId } = req.params;
    const isBlockNumber = !blockId.startsWith('0x') && /^\d+$/.test(blockId);
    
    let query: string;
    if (isBlockNumber) {
      // Query by block number using index (block_timestamp, block_number)
      query = `
        SELECT 
          b.block_number,
          b.block_hash,
          b.block_timestamp,
          COUNT(DISTINCT t.tx_hash) as total_txns,
          COUNT(DISTINCT CASE WHEN t.timeboosted = 1 THEN t.tx_hash END) as express_lane_txns,
          SUM(CASE WHEN t.gas_details.coinbase_transfer IS NOT NULL 
              THEN CAST(t.gas_details.coinbase_transfer AS UInt128) 
              ELSE 0 END) as total_coinbase_transfer,
          SUM(CAST(t.gas_details.gas_used AS UInt128)) as total_gas_used
        FROM ethereum.blocks b
        INNER JOIN brontes.tree t ON b.block_number = t.block_number
        WHERE b.block_number = ${parseInt(blockId)} AND b.valid = 1
        GROUP BY b.block_number, b.block_hash, b.block_timestamp
        LIMIT 1
      `;
    } else {
      // Query by block hash
      query = `
        SELECT 
          b.block_number,
          b.block_hash,
          b.block_timestamp,
          COUNT(DISTINCT t.tx_hash) as total_txns,
          COUNT(DISTINCT CASE WHEN t.timeboosted = 1 THEN t.tx_hash END) as express_lane_txns,
          SUM(CASE WHEN t.gas_details.coinbase_transfer IS NOT NULL 
              THEN CAST(t.gas_details.coinbase_transfer AS UInt128) 
              ELSE 0 END) as total_coinbase_transfer,
          SUM(CAST(t.gas_details.gas_used AS UInt128)) as total_gas_used
        FROM ethereum.blocks b
        INNER JOIN brontes.tree t ON b.block_number = t.block_number
        WHERE b.block_hash = '${blockId}' AND b.valid = 1
        GROUP BY b.block_number, b.block_hash, b.block_timestamp
        LIMIT 1
      `;
    }

    const result = await req.clickhouse.query({
      query,
      format: 'JSONEachRow',
    });

    const data = await result.json<Array<{
      block_number: number;
      block_hash: string;
      block_timestamp: number;
      total_txns: number;
      express_lane_txns: number;
      total_coinbase_transfer: string;
      total_gas_used: string;
    }>>();

    if (data.length === 0) {
      res.status(404).json({
        error: 'Not Found',
        message: `Block ${blockId} not found`,
      });
      return;
    }

    const row = data[0];
    
    // Get transaction hashes for this block
    const txQuery = `
      SELECT tx_hash
      FROM brontes.tree
      WHERE block_number = ${row.block_number}
      ORDER BY tx_idx ASC
    `;
    
    const txResult = await req.clickhouse.query({
      query: txQuery,
      format: 'JSONEachRow',
    });

    const transactions = await txResult.json<Array<{ tx_hash: string }>>();

    const block: Block = {
      number: row.block_number,
      hash: row.block_hash,
      timestamp: formatRelativeTime(row.block_timestamp),
      miner: null,
      minerAddress: '0x0000000000000000000000000000000000000000',
      expressLaneTxns: row.express_lane_txns,
      totalTxns: row.total_txns,
      timeTaken: '12 secs',
      ethValue: row.total_coinbase_transfer && row.total_coinbase_transfer !== '0'
        ? formatEthValue(row.total_coinbase_transfer)
        : '0.00000',
      gasUsed: row.total_gas_used,
      transactions: transactions.map(tx => tx.tx_hash),
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
app.get('/transactions/:transactionId', async (
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
        bh.block_number,
        t.gas_details.priority_fee as priority_fee,
        t.gas_details.gas_used as gas_used,
        t.gas_details.effective_gas_price as effective_gas_price,
        bh.timeboosted,
        bh.express_lane_controller
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
      block_number: number;
      priority_fee: string;
      gas_used: string;
      effective_gas_price: string;
      timeboosted: boolean;
      express_lane_controller: string | null;
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

    const transaction: Transaction = {
      hash: row.tx_hash,
      blockNumber: row.block_number,
      profit: row.profit_usd,
      mevType: row.mev_type,
      timeboosted: row.timeboosted,
      expressLaneController: row.express_lane_controller,
      expressLanePrice: null,
      expressLaneRound: null,
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
app.get('/addresses/:address', async (
  req: Request<{ address: string }>, 
  res: Response<Address>
) => {
  const { address } = req.params;
  
  // Create dummy address data
  const addressData: Address = {
    address: address,
    balance: '1.234567',
    balanceInEth: '1.234567',
    transactionCount: 42,
    code: null,
    isContract: false,
    transactions: [],
  };
  
  res.json(addressData);
});

// Dashboard visualization endpoints

// Get Gross MEV time series
app.get('/api/gross-mev', async (
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
        time DESC
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
        time DESC
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
        time DESC
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
        time DESC
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
app.get('/api/atomic-mev-timeboosted', async (
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
          FROM mev.atomic_arbs
          ARRAY JOIN protocols AS proto
        ),
        real AS (
          SELECT
            toUnixTimestamp(toStartOfMinute(toDateTime(e.block_timestamp))) AS time,
            proto,
            sum(a.profit_usd / length(a.protocols)) AS profit_usd
          FROM mev.bundle_header AS b
          JOIN mev.atomic_arbs AS a ON a.tx_hash = b.tx_hash
          JOIN ethereum.blocks AS e ON e.block_number = b.block_number
          ARRAY JOIN a.protocols AS proto
          WHERE 
            b.mev_type = 'AtomicArb'
            AND b.timeboosted = true
            AND replaceAll(a.arb_type, '\\n', '') = 'Triangular Arbitrage'
            AND ${timeFilter}
          GROUP BY
            time,
            proto
        )
      SELECT
        t.time,
        p.proto,
        ifNull(r.profit_usd, 0) AS profit_usd
      FROM (SELECT DISTINCT time FROM real) AS t
      CROSS JOIN proto_list AS p
      LEFT JOIN real AS r
        ON r.time = t.time
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
    console.error('Error fetching Atomic MEV Timeboosted:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch Atomic MEV Timeboosted',
    });
  }
});

// Get Express Lane MEV Percentage
app.get('/api/express-lane-mev-percentage', async (
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

// Health check endpoint
app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req: Request, res: Response<RootResponse>) => {
  res.json({ 
    message: 'MEV GPT API Server',
    version: '1.0.0',
    endpoints: [
      'GET /latest-transactions',
      'GET /latest-blocks',
      'GET /blocks/:blockId',
      'GET /transactions/:transactionId',
      'GET /addresses/:address',
      'GET /api/gross-mev?timeRange=15min',
      'GET /api/gross-atomic-arb?timeRange=15min',
      'GET /api/gross-cex-dex-quotes?timeRange=15min',
      'GET /api/gross-liquidation?timeRange=15min',
      'GET /api/atomic-mev-timeboosted?timeRange=15min',
      'GET /api/express-lane-mev-percentage?timeRange=15min',
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

