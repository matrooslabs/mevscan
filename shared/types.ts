/**
 * Shared TypeScript type definitions for MEV GPT API
 * Used by both server and client
 */

/**
 * Transaction response type
 */
export interface Transaction {
  hash: string;
  blockNumber: number;
  profit: number;
  mevType: string;
  timeboosted: boolean;
  expressLaneController: string | null;
  expressLanePrice: string | null;
  expressLaneRound: number | null;
  from?: string;
  to?: string | null;
  toLabel?: string | null;
  value?: string;
  time?: string;
  gas?: string;
  gasPrice?: string;
  status?: string;
}

/**
 * Block response type (list item)
 */
export interface BlockListItem {
  hash: string;
  number: number;
  mevCount: number;
  totalProfit: number;
  timeboostedTxCount: number;
  timeboostedTxMevCount: number;
}

/**
 * Block response type (detailed)
 */
export interface Block {
  number: number;
  hash: string;
  timestamp?: string;
  miner?: string | null;
  minerAddress?: string;
  expressLaneTxns?: number;
  totalTxns?: number;
  timeTaken?: string;
  ethValue?: string;
  gasUsed?: number | string;
  transactions?: string[];
}

/**
 * Address response type
 */
export interface Address {
  address: string;
  balance: string;
  balanceInEth?: string;
  ethBalance?: string;
  transactionCount: number;
  code?: string | null;
  isContract?: boolean;
  transactions?: string[];
  firstSeen?: string;
  lastSeen?: string;
}

/**
 * Error response type
 */
export interface ErrorResponse {
  error: string;
  message: string;
}

/**
 * Health check response type
 */
export interface HealthResponse {
  status: string;
  message: string;
}

/**
 * Root endpoint response type
 */
export interface RootResponse {
  message: string;
  version: string;
  endpoints: string[];
}

/**
 * API Response wrapper for success
 */
export interface ApiSuccessResponse<T> {
  data: T;
  success: true;
}

/**
 * API Response wrapper for error
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  success: false;
}

/**
 * Generic API Response type
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Time series data point for chart visualization
 */
export interface TimeSeriesDataPoint {
  time: string;
  total: number;
  normal: number;
  timeboost: number;
}

/**
 * Time series response type
 */
export type TimeSeriesResponse = TimeSeriesDataPoint[];

/**
 * Time series data point by protocol for Atomic MEV Timeboosted
 */
export interface TimeSeriesByProtocolDataPoint {
  time: string;
  proto: string;
  profit_usd: number;
}

/**
 * Time series by protocol response type
 */
export type TimeSeriesByProtocolResponse = TimeSeriesByProtocolDataPoint[];

/**
 * Pie chart response type for Express Lane MEV Percentage
 */
export interface PieChartResponse {
  total: number;
  timeboost: number;
  percentage: number;
}

/**
 * Time series data point with percentage for Express Lane MEV Percentage over time
 */
export interface TimeSeriesPercentageDataPoint {
  time: string;
  total: number;
  timeboost: number;
  percentage: number;
}

/**
 * Time series percentage response type
 */
export type TimeSeriesPercentageResponse = TimeSeriesPercentageDataPoint[];

/**
 * Express Lane Net Profit data point
 */
export interface ExpressLaneNetProfitDataPoint {
  round: number;
  controller: string;
  price: number;
  profit: number;
  net_profit: number;
}

/**
 * Express Lane Net Profit response type
 */
export type ExpressLaneNetProfitResponse = ExpressLaneNetProfitDataPoint[];

/**
 * Express Lane Profit by Controller data point
 */
export interface ExpressLaneProfitByControllerDataPoint {
  controller: string;
  net_profit_total: number;
}

/**
 * Express Lane Profit by Controller response type
 */
export type ExpressLaneProfitByControllerResponse = ExpressLaneProfitByControllerDataPoint[];

/**
 * Timeboost Revenue data point
 */
export interface TimeboostRevenueDataPoint {
  total_first_price: number;
  total_second_price: number;
}

/**
 * Timeboost Revenue response type
 */
export type TimeboostRevenueResponse = TimeboostRevenueDataPoint;

/**
 * Bids per address data point
 */
export interface BidsPerAddressDataPoint {
  bidder: string;
  bid_count: number;
}

/**
 * Bids per address response type
 */
export type BidsPerAddressResponse = BidsPerAddressDataPoint[];

/**
 * Auction win count data point
 */
export interface AuctionWinCountDataPoint {
  address: string;
  wins: number;
}

/**
 * Auction win count response type
 */
export type AuctionWinCountResponse = AuctionWinCountDataPoint[];

/**
 * Timeboosted tx per second data point
 */
export interface TimeboostedTxPerSecondDataPoint {
  time: string;
  tx_count: number;
}

/**
 * Timeboosted tx per second response type
 */
export type TimeboostedTxPerSecondResponse = TimeboostedTxPerSecondDataPoint[];

/**
 * Timeboosted tx per block data point
 */
export interface TimeboostedTxPerBlockDataPoint {
  block_number: number;
  tx_count: number;
}

/**
 * Timeboosted tx per block response type
 */
export type TimeboostedTxPerBlockResponse = TimeboostedTxPerBlockDataPoint[];

/**
 * Bids per round data point
 */
export interface BidsPerRoundDataPoint {
  round: number;
  bid_count: number;
}

/**
 * Bids per round response type
 */
export type BidsPerRoundResponse = BidsPerRoundDataPoint[];

/**
 * Express lane price data point
 */
export interface ExpressLanePriceDataPoint {
  round: number;
  first_price: number;
  second_price: number;
  winner: string;
  second_place: string;
}

/**
 * Express lane price response type
 */
export type ExpressLanePriceResponse = ExpressLanePriceDataPoint[];

