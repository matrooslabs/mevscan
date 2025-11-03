require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Dummy data - Latest transactions
const latestTransactions = [
  { 
    hash: '0xb791a07c9aefa03db87f8ad128121ed5b8a7096d8c968df682686ac7ea61e594', 
    from: '0xdadB0d80...24f783711', 
    to: '0x4675C7e5...ef3b0a263', 
    toLabel: null,
    value: '0.20476', 
    time: '20 secs ago' 
  },
  { 
    hash: '0x51640f94fc391cfc47e120e1f877c95ad87a74f639dd23497e591679979d50c9', 
    from: '0xdadB0d80...24f783711', 
    to: '0xB423b53D...adC211020', 
    toLabel: null,
    value: '0.00158', 
    time: '20 secs ago' 
  },
  { 
    hash: '0x3481191f2f58b1e8bd28925ea21e39a9831e2131e9ffba9c62df25f95ca42d0c', 
    from: '0x0Dc1E92F...3b1A03d73', 
    to: '0x3Fb9cED5...39519f65A', 
    toLabel: null,
    value: '0.22', 
    time: '20 secs ago' 
  },
  { 
    hash: '0x1053e70bd8f205624b27e157d34c569eb317d5d4365f27ec79a4956426f68cab', 
    from: '0x2A66c35C...54c1471FD', 
    to: '0xf984A448...396272A65', 
    toLabel: null,
    value: '0.0022', 
    time: '20 secs ago' 
  },
  { 
    hash: '0xd883c28e36e95cc0dcc1ac63b432f83f9aa4ad07718b619cb58f97b69ad301a7', 
    from: '0xd1Db5ecb...51F29E707', 
    to: '0x307576Dd...E8e067d31', 
    toLabel: null,
    value: '0.00578', 
    time: '20 secs ago' 
  },
  { 
    hash: '0x6e09878217cbf8cb54746e41021e1aba6cdf144f4205bbfdd836891825905ceb', 
    from: '0x66E092fD...d738aE7bC', 
    to: '0xC333E80e...2D294F771', 
    toLabel: null,
    value: '960', 
    time: '20 secs ago' 
  },
];

// Dummy data - Latest blocks
const latestBlocks = [
  { 
    number: 23717104, 
    timestamp: '5 secs ago', 
    miner: 'Titan Builder', 
    minerAddress: '0x4838b106...B0BAD5f97',
    expressLaneTxns: 45,
    totalTxns: 220, 
    timeTaken: '12 secs',
    ethValue: '0.03488'
  },
  { 
    number: 23717103, 
    timestamp: '17 secs ago', 
    miner: 'BuilderNet', 
    minerAddress: '0xdadb0d80...24f783711',
    expressLaneTxns: 52,
    totalTxns: 234, 
    timeTaken: '12 secs',
    ethValue: '0.02176'
  },
  { 
    number: 23717102, 
    timestamp: '29 secs ago', 
    miner: 'Titan Builder', 
    minerAddress: '0x4838b106...B0BAD5f97',
    expressLaneTxns: 68,
    totalTxns: 282, 
    timeTaken: '12 secs',
    ethValue: '0.07486'
  },
  { 
    number: 23717101, 
    timestamp: '41 secs ago', 
    miner: null, 
    minerAddress: '0x1f9090aa...8e676c326',
    expressLaneTxns: 23,
    totalTxns: 110, 
    timeTaken: '12 secs',
    ethValue: '0.00724'
  },
  { 
    number: 23717100, 
    timestamp: '53 secs ago', 
    miner: 'BuilderNet', 
    minerAddress: '0xdadb0d80...24f783711',
    expressLaneTxns: 89,
    totalTxns: 382, 
    timeTaken: '12 secs',
    ethValue: '0.02058'
  },
  { 
    number: 23717099, 
    timestamp: '1 min ago', 
    miner: 'Titan Builder', 
    minerAddress: '0x4838b106...B0BAD5f97',
    expressLaneTxns: 38,
    totalTxns: 202, 
    timeTaken: '12 secs',
    ethValue: '0.01849'
  },
];

// Helper function to simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Routes

// Get latest transactions
app.get('/latest-transactions', async (req, res) => {
  await delay(300); // Simulate network delay
  res.json(latestTransactions);
});

// Get latest blocks
app.get('/latest-blocks', async (req, res) => {
  await delay(300); // Simulate network delay
  res.json(latestBlocks);
});

// Get a specific block by identifier (hash or number)
app.get('/blocks/:blockId', async (req, res) => {
  await delay(300);
  const { blockId } = req.params;
  
  // Try to find by number first
  let block = latestBlocks.find(b => b.number.toString() === blockId);
  
  // If not found by number, create a dummy block based on the ID
  if (!block) {
    block = {
      number: parseInt(blockId) || 23717104,
      hash: blockId.startsWith('0x') ? blockId : `0x${blockId}`,
      timestamp: 'Just now',
      miner: 'Titan Builder',
      minerAddress: '0x4838b106...B0BAD5f97',
      expressLaneTxns: 45,
      totalTxns: 220,
      timeTaken: '12 secs',
      ethValue: '0.03488',
      parentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      gasLimit: 30000000,
      gasUsed: 25000000,
      baseFeePerGas: '0x123456789',
      transactions: latestTransactions.map(tx => tx.hash),
    };
  }
  
  res.json(block);
});

// Get a specific transaction by identifier
app.get('/transactions/:transactionId', async (req, res) => {
  await delay(300);
  const { transactionId } = req.params;
  
  // Try to find in latest transactions
  let transaction = latestTransactions.find(tx => tx.hash === transactionId);
  
  // If not found, create a dummy transaction
  if (!transaction) {
    transaction = {
      hash: transactionId,
      from: '0xdadB0d80...24f783711',
      to: '0x4675C7e5...ef3b0a263',
      toLabel: null,
      value: '0.20476',
      time: 'Just now',
      blockNumber: 23717104,
      blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      gas: '21000',
      gasPrice: '0x123456789',
      nonce: 123,
      input: '0x',
      status: 'success',
    };
  }
  
  res.json(transaction);
});

// Get a specific address by identifier
app.get('/addresses/:address', async (req, res) => {
  await delay(300);
  const { address } = req.params;
  
  // Create dummy address data
  const addressData = {
    address: address,
    balance: '1.234567',
    balanceInEth: '1.234567',
    transactionCount: 42,
    code: null,
    isContract: false,
    transactions: latestTransactions.filter(tx => 
      tx.from === address || tx.to === address
    ).map(tx => tx.hash),
  };
  
  res.json(addressData);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
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
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
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

