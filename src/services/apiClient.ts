import axios, { AxiosInstance } from 'axios';
import type {
  Transaction,
  Block,
  BlockListItem,
  Address,
} from '../../shared/types';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
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
   * @returns Promise resolving to an array of transaction objects
   */
  async getLatestTransactions(): Promise<Transaction[]> {
    try {
      const response = await this.client.get<Transaction[]>('/latest-transactions');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get latest blocks
   * @returns Promise resolving to an array of block objects
   */
  async getLatestBlocks(): Promise<BlockListItem[]> {
    try {
      const response = await this.client.get<BlockListItem[]>('/latest-blocks');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific block by identifier
   * @param blockId - Block hash or block number
   * @returns Promise resolving to block data
   */
  async getBlock(blockId: string): Promise<Block> {
    try {
      const response = await this.client.get<Block>(`/blocks/${blockId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific transaction by identifier
   * @param transactionId - Transaction hash
   * @returns Promise resolving to transaction data
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    try {
      const response = await this.client.get<Transaction>(`/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific address by identifier
   * @param address - Address hash
   * @returns Promise resolving to address data
   */
  async getAddress(address: string): Promise<Address> {
    try {
      const response = await this.client.get<Address>(`/addresses/${address}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @private
   * @param error - Axios error object
   * @returns Formatted error
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const message = (error.response.data as { message?: string })?.message || error.response.statusText;
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
    } else if (error instanceof Error) {
      return error;
    } else {
      return new Error('Unknown error occurred');
    }
  }
}

export default ApiClient;

