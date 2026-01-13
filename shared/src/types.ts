/**
 * Shared TypeScript type definitions for MEVScan API
 * Used by both server and client
 */

/**
 * Token delta information
 */
export interface TokenDelta {
  tokenAddress: string;
  decimals: number;
  symbol: string;
  delta: number;
  deltaUsd: number;
}

/**
 * Balance delta for a specific transaction/address
 */
export interface BalanceDelta {
  txHash: string;
  address: string;
  name: string | null;
  tokenDeltas: TokenDelta[];
}

/**
 * Transaction response type
 */
export interface Transaction {
  hash: string;
  blockNumber: number;
  profit: number;
  mevType: string;
  mevContract?: string | null;
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
  balanceDeltas?: BalanceDelta[];
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
  ethPrice?: number;
}

/**
 * Block bundle/transaction item
 */
export interface BlockBundle {
  txHash: string;
  txIndex: number;
  profitUsd: number;
  bribeUsd: number;
  mevType: string;
  mevContract: string | null;
  eoa: string;
  timeboosted: boolean;
  expressLaneController: string | null;
  expressLanePriceUsd: number | null;
  expressLaneRound: number | null;
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
  totalMevProfitUsd?: number;
  transactions?: string[];
  bundles?: BlockBundle[];
}

/**
 * MEV Transaction (unified for both EOA and contracts)
 */
export interface MEVTransaction {
  txHash: string;
  blockNumber: number;
  txIndex: number;
  profitUsd: number;
  bribeUsd: number;
  mevType: string;
  mevContract: string | null; // For EOA: the contract used, for contracts: null
  eoa: string | null; // For contracts: the EOA, for EOA: null
  timeboosted: boolean;
  expressLaneController: string | null;
  expressLanePriceUsd: number | null;
  expressLaneRound: number | null;
}

/**
 * Pagination metadata
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated MEV transactions response
 */
export interface PaginatedMEVTransactions {
  transactions: MEVTransaction[];
  pagination: PaginationInfo;
}

/**
 * Address statistics
 */
export interface AddressStatistics {
  totalProfitUsd: number;
  totalBribeUsd: number;
  totalTransactions: number;
  timeboostedCount: number;
  mevTypeBreakdown: Record<string, number>;
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
  // New fields for enhanced address page
  statistics?: AddressStatistics;
  mevTransactions?: PaginatedMEVTransactions; // Paginated MEV transactions list
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
 * time is Unix timestamp in seconds - frontend handles formatting based on time range
 */
export interface TimeSeriesDataPoint {
  time: number;
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
 * time is Unix timestamp in seconds - frontend handles formatting based on time range
 */
export interface TimeSeriesByProtocolDataPoint {
  time: number;
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
 * time is Unix timestamp in seconds - frontend handles formatting based on time range
 */
export interface TimeSeriesPercentageDataPoint {
  time: number;
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

/**
 * Swap information for atomic arbitrage
 */
export interface SwapInfo {
  trace_idx: number;
  from: string;
  recipient: string;
  pool: string;
  token_in: [string, string];
  token_out: [string, string];
  amount_in: [string, string];
  amount_out: [string, string];
}

/**
 * Gas details information
 */
export interface GasDetails {
  coinbase_transfer: string | null;
  priority_fee: string;
  gas_used: string;
  effective_gas_price: string;
}

/**
 * Atomic arbitrage response
 */
export interface AtomicArbResponse {
  tx_hash: string;
  block_number: number;
  trigger_tx: string;
  swaps: SwapInfo[];
  gas_details: GasDetails;
  arb_type: string;
  run_id: number;
  profit_usd: number;
  protocols: string[];
}

/**
 * CexDex quote response
 */
export interface CexDexQuoteResponse {
  tx_hash: string;
  block_timestamp: number;
  block_number: number;
  swaps: SwapInfo[];
  instant_mid_price: number[];
  t2_mid_price: number[];
  t12_mid_price: number[];
  t30_mid_price: number[];
  t60_mid_price: number[];
  t300_mid_price: number[];
  exchange: string;
  pnl: number;
  gas_details: GasDetails;
  run_id: number;
  profit_usd: number;
  protocols: string[];
}

/**
 * Liquidation swap information
 */
export interface LiquidationSwapInfo {
  trace_idx: number;
  from: string;
  recipient: string;
  pool: string;
  token_in: [string, string];
  token_out: [string, string];
  amount_in: [string, string];
  amount_out: [string, string];
}

/**
 * Liquidation information
 */
export interface LiquidationInfo {
  trace_idx: number;
  pool: string;
  liquidator: string;
  debtor: string;
  collateral_asset: [string, string];
  debt_asset: [string, string];
  covered_debt: [string, string];
  liquidated_collateral: [string, string];
}

/**
 * Liquidation response
 */
export interface LiquidationResponse {
  liquidation_tx_hash: string;
  block_number: number;
  liquidation_swaps: LiquidationSwapInfo[];
  liquidations: LiquidationInfo[];
  gas_details: GasDetails;
  run_id: number;
  profit_usd: number;
  protocols: string[];
}

/**
 * Express Lane Transaction
 */
export interface ExpressLaneTransaction {
  blockTimestamp: number;
  blockNumber: number;
  txIndex: number;
  txHash: string;
  profitUsd: number;
  expressLanePrice: string | null;
  expressLanePriceUsd: number | null;
  expressLaneRound: number;
  expressLaneController: string | null;
  mevType: string;
}

/**
 * Auction Info from timeboost.auction table
 */
export interface AuctionInfo {
  blockNumber: number | null;
  logIndex: number | null;
  txHash: string | null;
  contractAddress: string;
  isMultiBidAuction: boolean;
  round: number;
  firstPriceBidder: string;
  firstPriceExpressLaneController: string;
  firstPriceAmount: string;
  price: string;
  roundStartTimestamp: number;
  roundEndTimestamp: number;
}