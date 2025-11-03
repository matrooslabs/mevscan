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
   * @returns {Promise} Axios response with transactions data
   */
  async getLatestTransactions() {
    try {
      const response = await this.client.get('/transactions');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get latest blocks
   * @returns {Promise} Axios response with blocks data
   */
  async getLatestBlocks() {
    try {
      const response = await this.client.get('/blocks');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
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

