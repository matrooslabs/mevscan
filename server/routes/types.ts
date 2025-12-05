// Shared types and imports for all route files
import type {
  Transaction,
  Block,
  BlockListItem,
  Address,
  MEVTransaction,
  AddressStatistics,
  PaginatedMEVTransactions,
  PaginationInfo,
  ErrorResponse,
  HealthResponse,
  RootResponse,
  TimeSeriesResponse,
  TimeSeriesDataPoint,
  TimeSeriesByProtocolResponse,
  TimeSeriesByProtocolDataPoint,
  PieChartResponse,
  TimeSeriesPercentageResponse,
  TimeSeriesPercentageDataPoint,
  ExpressLaneNetProfitResponse,
  ExpressLaneNetProfitDataPoint,
  ExpressLaneProfitByControllerResponse,
  ExpressLaneProfitByControllerDataPoint,
  TimeboostRevenueResponse,
  BidsPerAddressResponse,
  AuctionWinCountResponse,
  TimeboostedTxPerSecondResponse,
  TimeboostedTxPerBlockResponse,
  BidsPerRoundResponse,
  ExpressLanePriceResponse,
  BlockBundle,
  BalanceDelta,
  TokenDelta,
  AtomicArbResponse,
  CexDexQuoteResponse,
  LiquidationResponse,
} from '@mevscan/shared';
import {
  formatRelativeTime,
  formatEthValue,
  getTimeRangeFilter,
  getTimestampTimeRangeFilter,
} from '../middlewares';
import type { Request, Response } from 'express';
import type { Express } from 'express';

// Re-export types
export type {
  Transaction,
  Block,
  BlockListItem,
  Address,
  MEVTransaction,
  AddressStatistics,
  PaginatedMEVTransactions,
  PaginationInfo,
  ErrorResponse,
  HealthResponse,
  RootResponse,
  TimeSeriesResponse,
  TimeSeriesDataPoint,
  TimeSeriesByProtocolResponse,
  TimeSeriesByProtocolDataPoint,
  PieChartResponse,
  TimeSeriesPercentageResponse,
  TimeSeriesPercentageDataPoint,
  ExpressLaneNetProfitResponse,
  ExpressLaneNetProfitDataPoint,
  ExpressLaneProfitByControllerResponse,
  ExpressLaneProfitByControllerDataPoint,
  TimeboostRevenueResponse,
  BidsPerAddressResponse,
  AuctionWinCountResponse,
  TimeboostedTxPerSecondResponse,
  TimeboostedTxPerBlockResponse,
  BidsPerRoundResponse,
  ExpressLanePriceResponse,
  BlockBundle,
  BalanceDelta,
  TokenDelta,
  AtomicArbResponse,
  CexDexQuoteResponse,
  LiquidationResponse,
};

// Re-export helper functions
export {
  formatRelativeTime,
  formatEthValue,
  getTimeRangeFilter,
  getTimestampTimeRangeFilter,
};

// Re-export Express types
export type { Request, Response, Express };

