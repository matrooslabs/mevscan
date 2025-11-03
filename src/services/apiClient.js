/**
 * @typedef {import('../../shared/types').Transaction} Transaction
 * @typedef {import('../../shared/types').Block} Block
 * @typedef {import('../../shared/types').BlockListItem} BlockListItem
 * @typedef {import('../../shared/types').Address} Address
 */

import axios from 'axios';

class ApiClient {
  /**
   * @param {string} baseURL
   */
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
   * @returns {Promise<Transaction[]>} Array of transaction objects
   */
  async getLatestTransactions() {
    try {
      const response = await this.client.get('/latest-transactions');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get latest blocks
   * @returns {Promise<BlockListItem[]>} Array of block objects
   */
  async getLatestBlocks() {
    try {
      const response = await this.client.get('/latest-blocks');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific block by identifier
   * @param {string} blockId - Block hash or block number
   * @returns {Promise<Block>} Block data
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
   * @returns {Promise<Transaction>} Transaction data
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
   * Get a specific address by identifier
   * @param {string} address - Address hash
   * @returns {Promise<Address>} Address data
   */
  async getAddress(address) {
    try {
      const response = await this.client.get(`/addresses/${address}`);
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
      const message = error.response.data?.message || error.response.statusText;
      return new Error(
        `API Error: ${error.response.status} - ${message}`
      );
    } else if (error.request) {
      // Request made but no response received
      return new Error('Network Error: No response from server. Make sure the server is running on http://localhost:3001');
    } else {
      // Error setting up request
      return new Error(`Request Error: ${error.message}`);
    }
  }
}

export default ApiClient;

