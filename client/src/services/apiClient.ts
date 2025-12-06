import axios, { AxiosInstance } from 'axios';
import type {
  Transaction,
  Block,
  BlockListItem,
  Address,
  TimeSeriesResponse,
  TimeSeriesByProtocolResponse,
  PieChartResponse,
  TimeSeriesPercentageResponse,
  ExpressLaneNetProfitResponse,
  ExpressLaneProfitByControllerResponse,
  TimeboostRevenueResponse,
  BidsPerAddressResponse,
  AuctionWinCountResponse,
  BidsPerRoundResponse,
  ExpressLanePriceResponse,
  AtomicArbResponse,
  CexDexQuoteResponse,
  LiquidationResponse,
} from '@mevscan/shared';

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
      const response = await this.client.get<Transaction[]>('/api/latest-transactions', { params });
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
      const response = await this.client.get<BlockListItem[]>('/api/latest-blocks', { params });
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
      const response = await this.client.get<Block>(`/api/blocks/${blockId}`);
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
      const response = await this.client.get<Transaction>(`/api/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific address by identifier
   * @param address - Address hash
   * @param page - Page number (default: 1)
   * @param pageSize - Number of items per page (default: 20)
   * @returns Promise resolving to address data
   */
  async getAddress(address: string, page: number = 1, pageSize: number = 20): Promise<Address> {
    try {
      const response = await this.client.get<Address>(`/api/addresses/${address}`, {
        params: { page, pageSize },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Gross MEV time series data
   * @returns Promise resolving to time series data
   */
  async getGrossMEV(): Promise<TimeSeriesResponse> {
    try {
      const response = await this.client.get<TimeSeriesResponse>('/api/gross-mev');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Gross Atomic Arb time series data
   * @returns Promise resolving to time series data
   */
  async getGrossAtomicArb(): Promise<TimeSeriesResponse> {
    try {
      const response = await this.client.get<TimeSeriesResponse>('/api/gross-atomic-arb');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Gross CexDexQuotes time series data
   * @returns Promise resolving to time series data
   */
  async getGrossCexDexQuotes(): Promise<TimeSeriesResponse> {
    try {
      const response = await this.client.get<TimeSeriesResponse>('/api/gross-cex-dex-quotes');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Gross Liquidation time series data
   * @returns Promise resolving to time series data
   */
  async getGrossLiquidation(): Promise<TimeSeriesResponse> {
    try {
      const response = await this.client.get<TimeSeriesResponse>('/api/gross-liquidation');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Atomic MEV Timeboosted time series data by protocol
   * @returns Promise resolving to time series data by protocol
   */
  async getAtomicMEVTimeboosted(): Promise<TimeSeriesByProtocolResponse> {
    try {
      const response = await this.client.get<TimeSeriesByProtocolResponse>('/api/protocols/atomic-mev/timeboosted');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Express Lane MEV Percentage
   * @returns Promise resolving to pie chart data
   */
  async getExpressLaneMEVPercentage(): Promise<PieChartResponse> {
    try {
      const response = await this.client.get<PieChartResponse>('/api/express-lane/mev-percentage');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Express Lane MEV Percentage per minute time series
   * @returns Promise resolving to time series percentage data
   */
  async getExpressLaneMEVPercentagePerMinute(): Promise<TimeSeriesPercentageResponse> {
    try {
      const response = await this.client.get<TimeSeriesPercentageResponse>('/api/express-lane/mev-percentage-per-minute');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Atomic Arb MEV time series data by protocol
   * @returns Promise resolving to time series data by protocol
   */
  async getAtomicMEV(): Promise<TimeSeriesByProtocolResponse> {
    try {
      const response = await this.client.get<TimeSeriesByProtocolResponse>('/api/protocols/atomic-mev');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get CexDex Arb time series data by protocol
   * @returns Promise resolving to time series data by protocol
   */
  async getCexDex(): Promise<TimeSeriesByProtocolResponse> {
    try {
      const response = await this.client.get<TimeSeriesByProtocolResponse>('/api/protocols/cexdex');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get CexDex MEV Timeboosted time series data by protocol
   * @returns Promise resolving to time series data by protocol
   */
  async getCexDexTimeboosted(): Promise<TimeSeriesByProtocolResponse> {
    try {
      const response = await this.client.get<TimeSeriesByProtocolResponse>('/api/protocols/cexdex/timeboosted');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Liquidation time series data by protocol
   * @returns Promise resolving to time series data by protocol
   */
  async getLiquidation(): Promise<TimeSeriesByProtocolResponse> {
    try {
      const response = await this.client.get<TimeSeriesByProtocolResponse>('/api/protocols/liquidation');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Liquidation Timeboosted time series data by protocol
   * @returns Promise resolving to time series data by protocol
   */
  async getLiquidationTimeboosted(): Promise<TimeSeriesByProtocolResponse> {
    try {
      const response = await this.client.get<TimeSeriesByProtocolResponse>('/api/protocols/liquidation/timeboosted');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Express Lane Net Profit data
   * @returns Promise resolving to Express Lane Net Profit data
   */
  async getExpressLaneNetProfit(): Promise<ExpressLaneNetProfitResponse> {
    try {
      const response = await this.client.get<ExpressLaneNetProfitResponse>('/api/express-lane/net-profit');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Express Lane Profit by Controller data
   * @returns Promise resolving to Express Lane Profit by Controller data
   */
  async getExpressLaneProfitByController(): Promise<ExpressLaneProfitByControllerResponse> {
    try {
      const response = await this.client.get<ExpressLaneProfitByControllerResponse>('/api/express-lane/profit-by-controller');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Timeboost Gross Revenue (all-time, no timeRange)
   * @returns Promise resolving to Timeboost Revenue data
   */
  async getTimeboostGrossRevenue(): Promise<TimeboostRevenueResponse> {
    try {
      const response = await this.client.get<TimeboostRevenueResponse>('/api/timeboost/gross-revenue');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Timeboost Revenue (time-ranged)
   * @returns Promise resolving to Timeboost Revenue data
   */
  async getTimeboostRevenue(): Promise<TimeboostRevenueResponse> {
    try {
      const response = await this.client.get<TimeboostRevenueResponse>('/api/timeboost/revenue');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Bids per Address
   * @returns Promise resolving to Bids per Address data
   */
  async getBidsPerAddress(): Promise<BidsPerAddressResponse> {
    try {
      const response = await this.client.get<BidsPerAddressResponse>('/api/timeboost/bids-per-address');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Auction Win Count
   * @returns Promise resolving to Auction Win Count data
   */
  async getAuctionWinCount(): Promise<AuctionWinCountResponse> {
    try {
      const response = await this.client.get<AuctionWinCountResponse>('/api/timeboost/auction-win-count');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Bids per Round (no timeRange parameter - uses last 15 rounds)
   * @returns Promise resolving to Bids per Round data
   */
  async getBidsPerRound(): Promise<BidsPerRoundResponse> {
    try {
      const response = await this.client.get<BidsPerRoundResponse>('/api/timeboost/bids-per-round');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Express Lane Price
   * @returns Promise resolving to Express Lane Price data
   */
  async getExpressLanePrice(): Promise<ExpressLanePriceResponse> {
    try {
      const response = await this.client.get<ExpressLanePriceResponse>('/api/timeboost/express-lane-price');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get atomic arbitrage data by transaction hash
   * @param txHash - Transaction hash (64-character hex string, with or without 0x prefix)
   * @returns Promise resolving to atomic arbitrage data
   */
  async getAtomicArb(txHash: string): Promise<AtomicArbResponse> {
    try {
      const response = await this.client.get<AtomicArbResponse>('/api/mev/atomic', {
        params: { tx_hash: txHash },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get CexDex quote data by transaction hash
   * @param txHash - Transaction hash (64-character hex string, with or without 0x prefix)
   * @returns Promise resolving to CexDex quote data
   */
  async getCexDexQuote(txHash: string): Promise<CexDexQuoteResponse> {
    try {
      const response = await this.client.get<CexDexQuoteResponse>('/api/mev/cexdex', {
        params: { tx_hash: txHash },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get liquidation data by transaction hash
   * @param txHash - Transaction hash (64-character hex string, with or without 0x prefix)
   * @returns Promise resolving to liquidation data
   */
  async getLiquidationByTxHash(txHash: string): Promise<LiquidationResponse> {
    try {
      const response = await this.client.get<LiquidationResponse>('/api/mev/liquidations', {
        params: { tx_hash: txHash },
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

