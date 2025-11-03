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
} from '../shared/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

