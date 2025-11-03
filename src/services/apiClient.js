import axios from 'axios';

class ApiClient {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL: baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get latest transactions
   * @returns {Promise} Array of transaction objects
   */
  async getLatestTransactions() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return dummy data
    return [
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
  }

  /**
   * Get latest blocks
   * @returns {Promise} Array of block objects
   */
  async getLatestBlocks() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return dummy data
    return [
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
  }

  /**
   * Get a specific block by identifier
   * @param {string} blockId - Block hash or block number
   * @returns {Promise} Axios response with block data
   */
  async getBlock(blockId) {
    try {
      const response = await this.client.get(`/blocks/${blockId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific transaction by identifier
   * @param {string} transactionId - Transaction hash
   * @returns {Promise} Axios response with transaction data
   */
  async getTransaction(transactionId) {
    try {
      const response = await this.client.get(`/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @private
   * @param {Error} error - Axios error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return new Error(
        `API Error: ${error.response.status} - ${error.response.statusText}`
      );
    } else if (error.request) {
      // Request made but no response received
      return new Error('Network Error: No response from server');
    } else {
      // Error setting up request
      return new Error(`Request Error: ${error.message}`);
    }
  }
}

export default ApiClient;

