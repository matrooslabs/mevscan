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
export interface Block extends BlockListItem {
  hash?: string;
  parentHash?: string;
  gasLimit?: number;
  gasUsed?: number | string;
  baseFeePerGas?: string;
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

