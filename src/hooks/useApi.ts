import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import ApiClient from '../services/apiClient'
import type {
  Transaction,
  Block,
  BlockListItem,
  Address,
  TimeSeriesResponse,
  TimeSeriesByProtocolResponse,
  PieChartResponse,
} from '../../shared/types'

// Initialize API client - you may want to configure this based on your environment
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001')

/**
 * Query hook for fetching latest blocks
 * @param limit - Optional limit for number of blocks to retrieve (default: 20)
 * @returns Query result with array of block list items
 */
export function useLatestBlocks(limit?: number): UseQueryResult<BlockListItem[], Error> {
  return useQuery({
    queryKey: ['blocks', 'latest', limit],
    queryFn: async () => {
      const data = await apiClient.getLatestBlocks(limit)
      return data
    },
    refetchInterval: 12000, // Refetch every 12 seconds for real-time updates
  })
}

/**
 * Query hook for fetching latest transactions
 * @param limit - Optional limit for number of transactions to retrieve (default: 20)
 * @returns Query result with array of transactions
 */
export function useLatestTransactions(limit?: number): UseQueryResult<Transaction[], Error> {
  return useQuery({
    queryKey: ['transactions', 'latest', limit],
    queryFn: async () => {
      const data = await apiClient.getLatestTransactions(limit)
      return data
    },
    refetchInterval: 12000, // Refetch every 12 seconds for real-time updates
  })
}

/**
 * Query hook for fetching a specific block
 * @param blockId - Block hash or block number
 * @returns Query result with block data
 */
export function useBlock(blockId: string): UseQueryResult<Block, Error> {
  return useQuery({
    queryKey: ['blocks', blockId],
    queryFn: async () => {
      const data = await apiClient.getBlock(blockId)
      return data
    },
    enabled: !!blockId, // Only run query if blockId is provided
  })
}

/**
 * Query hook for fetching a specific transaction
 * @param transactionId - Transaction hash
 * @returns Query result with transaction data
 */
export function useTransaction(transactionId: string): UseQueryResult<Transaction, Error> {
  return useQuery({
    queryKey: ['transactions', transactionId],
    queryFn: async () => {
      const data = await apiClient.getTransaction(transactionId)
      return data
    },
    enabled: !!transactionId, // Only run query if transactionId is provided
  })
}

/**
 * Query hook for fetching a specific address
 * @param address - Address hash
 * @returns Query result with address data
 */
export function useAddress(address: string): UseQueryResult<Address, Error> {
  return useQuery({
    queryKey: ['addresses', address],
    queryFn: async () => {
      const data = await apiClient.getAddress(address)
      return data
    },
    enabled: !!address, // Only run query if address is provided
  })
}

/**
 * Query hook for fetching Gross MEV time series
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data
 */
export function useGrossMEV(timeRange: string = '15min'): UseQueryResult<TimeSeriesResponse, Error> {
  return useQuery({
    queryKey: ['gross-mev', timeRange],
    queryFn: async () => {
      const data = await apiClient.getGrossMEV(timeRange)
      return data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

/**
 * Query hook for fetching Gross Atomic Arb time series
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data
 */
export function useGrossAtomicArb(timeRange: string = '15min'): UseQueryResult<TimeSeriesResponse, Error> {
  return useQuery({
    queryKey: ['gross-atomic-arb', timeRange],
    queryFn: async () => {
      const data = await apiClient.getGrossAtomicArb(timeRange)
      return data
    },
    refetchInterval: 30000,
  })
}

/**
 * Query hook for fetching Gross CexDexQuotes time series
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data
 */
export function useGrossCexDexQuotes(timeRange: string = '15min'): UseQueryResult<TimeSeriesResponse, Error> {
  return useQuery({
    queryKey: ['gross-cex-dex-quotes', timeRange],
    queryFn: async () => {
      const data = await apiClient.getGrossCexDexQuotes(timeRange)
      return data
    },
    refetchInterval: 30000,
  })
}

/**
 * Query hook for fetching Gross Liquidation time series
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data
 */
export function useGrossLiquidation(timeRange: string = '15min'): UseQueryResult<TimeSeriesResponse, Error> {
  return useQuery({
    queryKey: ['gross-liquidation', timeRange],
    queryFn: async () => {
      const data = await apiClient.getGrossLiquidation(timeRange)
      return data
    },
    refetchInterval: 30000,
  })
}

/**
 * Query hook for fetching Atomic MEV Timeboosted time series
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data by protocol
 */
export function useAtomicMEVTimeboosted(timeRange: string = '15min'): UseQueryResult<TimeSeriesByProtocolResponse, Error> {
  return useQuery({
    queryKey: ['atomic-mev-timeboosted', timeRange],
    queryFn: async () => {
      const data = await apiClient.getAtomicMEVTimeboosted(timeRange)
      return data
    },
    refetchInterval: 30000,
  })
}

/**
 * Query hook for fetching Express Lane MEV Percentage
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with pie chart data
 */
export function useExpressLaneMEVPercentage(timeRange: string = '15min'): UseQueryResult<PieChartResponse, Error> {
  return useQuery({
    queryKey: ['express-lane-mev-percentage', timeRange],
    queryFn: async () => {
      const data = await apiClient.getExpressLaneMEVPercentage(timeRange)
      return data
    },
    refetchInterval: 30000,
  })
}

