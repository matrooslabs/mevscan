import axios, { AxiosInstance } from 'axios';
import type {
  Transaction,
  Block,
  BlockListItem,
  Address,
  TimeSeriesResponse,
  TimeSeriesByProtocolResponse,
  PieChartResponse,
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
   * @param limit - Optional limit for number of transactions to retrieve (default: 20)
   * @returns Promise resolving to an array of transaction objects
   */
  async getLatestTransactions(limit?: number): Promise<Transaction[]> {
    try {
      const params = limit ? { limit } : {};
      const response = await this.client.get<Transaction[]>('/latest-transactions', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get latest blocks
   * @param limit - Optional limit for number of blocks to retrieve (default: 20)
   * @returns Promise resolving to an array of block objects
   */
  async getLatestBlocks(limit?: number): Promise<BlockListItem[]> {
    try {
      const params = limit ? { limit } : {};
      const response = await this.client.get<BlockListItem[]>('/latest-blocks', { params });
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
   * Get Gross MEV time series data
   * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
   * @returns Promise resolving to time series data
   */
  async getGrossMEV(timeRange: string = '15min'): Promise<TimeSeriesResponse> {
    try {
      const response = await this.client.get<TimeSeriesResponse>('/api/gross-mev', {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Gross Atomic Arb time series data
   * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
   * @returns Promise resolving to time series data
   */
  async getGrossAtomicArb(timeRange: string = '15min'): Promise<TimeSeriesResponse> {
    try {
      const response = await this.client.get<TimeSeriesResponse>('/api/gross-atomic-arb', {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Gross CexDexQuotes time series data
   * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
   * @returns Promise resolving to time series data
   */
  async getGrossCexDexQuotes(timeRange: string = '15min'): Promise<TimeSeriesResponse> {
    try {
      const response = await this.client.get<TimeSeriesResponse>('/api/gross-cex-dex-quotes', {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Gross Liquidation time series data
   * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
   * @returns Promise resolving to time series data
   */
  async getGrossLiquidation(timeRange: string = '15min'): Promise<TimeSeriesResponse> {
    try {
      const response = await this.client.get<TimeSeriesResponse>('/api/gross-liquidation', {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Atomic MEV Timeboosted time series data by protocol
   * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
   * @returns Promise resolving to time series data by protocol
   */
  async getAtomicMEVTimeboosted(timeRange: string = '15min'): Promise<TimeSeriesByProtocolResponse> {
    try {
      const response = await this.client.get<TimeSeriesByProtocolResponse>('/api/protocols/atomic-mev/timeboosted', {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Express Lane MEV Percentage
   * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
   * @returns Promise resolving to pie chart data
   */
  async getExpressLaneMEVPercentage(timeRange: string = '15min'): Promise<PieChartResponse> {
    try {
      const response = await this.client.get<PieChartResponse>('/api/express-lane-mev-percentage', {
        params: { timeRange },
      });
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

