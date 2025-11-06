import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import ApiClient from '../services/apiClient'
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
  TimeboostedTxPerSecondResponse,
  TimeboostedTxPerBlockResponse,
  BidsPerRoundResponse,
  ExpressLanePriceResponse,
  AtomicArbResponse,
  CexDexQuoteResponse,
  LiquidationResponse,
} from '@mevscan/shared'

// Initialize API client - you may want to configure this based on your environment
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || '')

/**
 * Query priority levels for staggered loading
 */
export enum QueryPriority {
  CRITICAL = 0,    // Load immediately (0ms delay)
  HIGH = 1,        // Load after 100ms
  MEDIUM = 2,      // Load after 300ms
  LOW = 3,         // Load after 600ms
}

/**
 * Stagger delay configuration in milliseconds
 */
const STAGGER_DELAYS = {
  [QueryPriority.CRITICAL]: 0,
  [QueryPriority.HIGH]: 100,
  [QueryPriority.MEDIUM]: 300,
  [QueryPriority.LOW]: 600,
}

/**
 * React Query configuration constants
 */
const QUERY_CONFIG = {
  // Cache time: how long to keep unused data in cache (5 minutes)
  cacheTime: 5 * 60 * 1000,
  // Stale time: how long data is considered fresh (30 seconds)
  staleTime: 30 * 1000,
  // Refetch interval: how often to refetch (60 seconds)
  refetchInterval: 60 * 1000,
  // Prevent refetch on window focus
  refetchOnWindowFocus: false,
  // Keep previous data while refetching to prevent flicker
  keepPreviousData: true,
}

/**
 * Hook to enable query after delay (for staggered loading)
 */
function useStaggeredQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  priority: QueryPriority = QueryPriority.MEDIUM,
  customConfig?: Partial<typeof QUERY_CONFIG>
) {
  const delay = STAGGER_DELAYS[priority]
  const [enabled, setEnabled] = useState(delay === 0)

  useEffect(() => {
    if (delay > 0 && !enabled) {
      const timer = setTimeout(() => {
        setEnabled(true)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [delay, enabled])

  const config = { ...QUERY_CONFIG, ...customConfig }
  
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    ...config,
  })
}

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
export function useAddress(address: string, page: number = 1, pageSize: number = 20): UseQueryResult<Address, Error> {
  return useQuery({
    queryKey: ['addresses', address, page, pageSize],
    queryFn: async () => {
      const data = await apiClient.getAddress(address, page, pageSize)
      return data
    },
    enabled: !!address, // Only run query if address is provided
  })
}

/**
 * Query hook for fetching Gross MEV time series
 * Priority: CRITICAL - Loads immediately (main overview metric)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data
 */
export function useGrossMEV(timeRange: string = '15min'): UseQueryResult<TimeSeriesResponse, Error> {
  return useStaggeredQuery<TimeSeriesResponse>(
    ['gross-mev', timeRange],
    async () => {
      const data = await apiClient.getGrossMEV(timeRange)
      return data
    },
    QueryPriority.CRITICAL,
    { refetchInterval: 60000 } // 60 seconds
  )
}

/**
 * Query hook for fetching Gross Atomic Arb time series
 * Priority: CRITICAL - Loads immediately (main overview metric)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data
 */
export function useGrossAtomicArb(timeRange: string = '15min'): UseQueryResult<TimeSeriesResponse, Error> {
  return useStaggeredQuery<TimeSeriesResponse>(
    ['gross-atomic-arb', timeRange],
    async () => {
      const data = await apiClient.getGrossAtomicArb(timeRange)
      return data
    },
    QueryPriority.CRITICAL,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Gross CexDexQuotes time series
 * Priority: CRITICAL - Loads immediately (main overview metric)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data
 */
export function useGrossCexDexQuotes(timeRange: string = '15min'): UseQueryResult<TimeSeriesResponse, Error> {
  return useStaggeredQuery<TimeSeriesResponse>(
    ['gross-cex-dex-quotes', timeRange],
    async () => {
      const data = await apiClient.getGrossCexDexQuotes(timeRange)
      return data
    },
    QueryPriority.CRITICAL,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Gross Liquidation time series
 * Priority: CRITICAL - Loads immediately (main overview metric)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data
 */
export function useGrossLiquidation(timeRange: string = '15min'): UseQueryResult<TimeSeriesResponse, Error> {
  return useStaggeredQuery<TimeSeriesResponse>(
    ['gross-liquidation', timeRange],
    async () => {
      const data = await apiClient.getGrossLiquidation(timeRange)
      return data
    },
    QueryPriority.CRITICAL,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Atomic MEV Timeboosted time series
 * Priority: HIGH - Loads after 100ms (important protocol breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data by protocol
 */
export function useAtomicMEVTimeboosted(timeRange: string = '15min'): UseQueryResult<TimeSeriesByProtocolResponse, Error> {
  return useStaggeredQuery<TimeSeriesByProtocolResponse>(
    ['atomic-mev-timeboosted', timeRange],
    async () => {
      const data = await apiClient.getAtomicMEVTimeboosted(timeRange)
      return data
    },
    QueryPriority.HIGH,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Express Lane MEV Percentage
 * Priority: HIGH - Loads after 100ms (important summary metric)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with pie chart data
 */
export function useExpressLaneMEVPercentage(timeRange: string = '15min'): UseQueryResult<PieChartResponse, Error> {
  return useStaggeredQuery<PieChartResponse>(
    ['express-lane-mev-percentage', timeRange],
    async () => {
      const data = await apiClient.getExpressLaneMEVPercentage(timeRange)
      return data
    },
    QueryPriority.HIGH,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Express Lane MEV Percentage per minute time series
 * Priority: MEDIUM - Loads after 300ms (detailed time series)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series percentage data
 */
export function useExpressLaneMEVPercentagePerMinute(timeRange: string = '15min'): UseQueryResult<TimeSeriesPercentageResponse, Error> {
  return useStaggeredQuery<TimeSeriesPercentageResponse>(
    ['express-lane-mev-percentage-per-minute', timeRange],
    async () => {
      const data = await apiClient.getExpressLaneMEVPercentagePerMinute(timeRange)
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Atomic Arb MEV time series by protocol
 * Priority: HIGH - Loads after 100ms (important protocol breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data by protocol
 */
export function useAtomicMEV(timeRange: string = '15min'): UseQueryResult<TimeSeriesByProtocolResponse, Error> {
  return useStaggeredQuery<TimeSeriesByProtocolResponse>(
    ['atomic-mev', timeRange],
    async () => {
      const data = await apiClient.getAtomicMEV(timeRange)
      return data
    },
    QueryPriority.HIGH,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching CexDex Arb time series by protocol
 * Priority: MEDIUM - Loads after 300ms (protocol breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data by protocol
 */
export function useCexDex(timeRange: string = '15min'): UseQueryResult<TimeSeriesByProtocolResponse, Error> {
  return useStaggeredQuery<TimeSeriesByProtocolResponse>(
    ['cexdex', timeRange],
    async () => {
      const data = await apiClient.getCexDex(timeRange)
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching CexDex MEV Timeboosted time series by protocol
 * Priority: MEDIUM - Loads after 300ms (protocol breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data by protocol
 */
export function useCexDexTimeboosted(timeRange: string = '15min'): UseQueryResult<TimeSeriesByProtocolResponse, Error> {
  return useStaggeredQuery<TimeSeriesByProtocolResponse>(
    ['cexdex-timeboosted', timeRange],
    async () => {
      const data = await apiClient.getCexDexTimeboosted(timeRange)
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Liquidation time series by protocol
 * Priority: MEDIUM - Loads after 300ms (protocol breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data by protocol
 */
export function useLiquidation(timeRange: string = '15min'): UseQueryResult<TimeSeriesByProtocolResponse, Error> {
  return useStaggeredQuery<TimeSeriesByProtocolResponse>(
    ['liquidation', timeRange],
    async () => {
      const data = await apiClient.getLiquidation(timeRange)
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Liquidation Timeboosted time series by protocol
 * Priority: MEDIUM - Loads after 300ms (protocol breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with time series data by protocol
 */
export function useLiquidationTimeboosted(timeRange: string = '15min'): UseQueryResult<TimeSeriesByProtocolResponse, Error> {
  return useStaggeredQuery<TimeSeriesByProtocolResponse>(
    ['liquidation-timeboosted', timeRange],
    async () => {
      const data = await apiClient.getLiquidationTimeboosted(timeRange)
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Express Lane Net Profit
 * Priority: LOW - Loads after 600ms (detailed breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with Express Lane Net Profit data
 */
export function useExpressLaneNetProfit(timeRange: string = '15min'): UseQueryResult<ExpressLaneNetProfitResponse, Error> {
  return useStaggeredQuery<ExpressLaneNetProfitResponse>(
    ['express-lane-net-profit', timeRange],
    async () => {
      const data = await apiClient.getExpressLaneNetProfit(timeRange)
      return data
    },
    QueryPriority.LOW,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Express Lane Profit by Controller
 * Priority: LOW - Loads after 600ms (detailed breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with Express Lane Profit by Controller data
 */
export function useExpressLaneProfitByController(timeRange: string = '15min'): UseQueryResult<ExpressLaneProfitByControllerResponse, Error> {
  return useStaggeredQuery<ExpressLaneProfitByControllerResponse>(
    ['express-lane-profit-by-controller', timeRange],
    async () => {
      const data = await apiClient.getExpressLaneProfitByController(timeRange)
      return data
    },
    QueryPriority.LOW,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Timeboost Gross Revenue (all-time)
 * Priority: LOW - Loads after 600ms (summary metric, less critical)
 * @returns Query result with Timeboost Revenue data
 */
export function useTimeboostGrossRevenue(): UseQueryResult<TimeboostRevenueResponse, Error> {
  return useStaggeredQuery<TimeboostRevenueResponse>(
    ['timeboost-gross-revenue'],
    async () => {
      const data = await apiClient.getTimeboostGrossRevenue()
      return data
    },
    QueryPriority.LOW,
    { refetchInterval: 120000 } // 2 minutes - all-time data changes less frequently
  )
}

/**
 * Query hook for fetching Timeboost Revenue (time-ranged)
 * Priority: LOW - Loads after 600ms (detailed breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with Timeboost Revenue data
 */
export function useTimeboostRevenue(timeRange: string = '15min'): UseQueryResult<TimeboostRevenueResponse, Error> {
  return useStaggeredQuery<TimeboostRevenueResponse>(
    ['timeboost-revenue', timeRange],
    async () => {
      const data = await apiClient.getTimeboostRevenue(timeRange)
      return data
    },
    QueryPriority.LOW,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Bids per Address
 * Priority: MEDIUM - Loads after 300ms (detailed breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with Bids per Address data
 */
export function useBidsPerAddress(timeRange: string = '15min'): UseQueryResult<BidsPerAddressResponse, Error> {
  return useStaggeredQuery<BidsPerAddressResponse>(
    ['bids-per-address', timeRange],
    async () => {
      const data = await apiClient.getBidsPerAddress(timeRange)
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Auction Win Count
 * Priority: MEDIUM - Loads after 300ms (detailed breakdown)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with Auction Win Count data
 */
export function useAuctionWinCount(timeRange: string = '15min'): UseQueryResult<AuctionWinCountResponse, Error> {
  return useStaggeredQuery<AuctionWinCountResponse>(
    ['auction-win-count', timeRange],
    async () => {
      const data = await apiClient.getAuctionWinCount(timeRange)
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Timeboosted Tx per Second
 * Priority: MEDIUM - Loads after 300ms (time series data)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with Timeboosted Tx per Second data
 */
export function useTimeboostedTxPerSecond(timeRange: string = '15min'): UseQueryResult<TimeboostedTxPerSecondResponse, Error> {
  return useStaggeredQuery<TimeboostedTxPerSecondResponse>(
    ['timeboosted-tx-per-second', timeRange],
    async () => {
      const data = await apiClient.getTimeboostedTxPerSecond(timeRange)
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Timeboosted Tx per Block
 * Priority: MEDIUM - Loads after 300ms (time series data)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with Timeboosted Tx per Block data
 */
export function useTimeboostedTxPerBlock(timeRange: string = '15min'): UseQueryResult<TimeboostedTxPerBlockResponse, Error> {
  return useStaggeredQuery<TimeboostedTxPerBlockResponse>(
    ['timeboosted-tx-per-block', timeRange],
    async () => {
      const data = await apiClient.getTimeboostedTxPerBlock(timeRange)
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Bids per Round
 * Priority: MEDIUM - Loads after 300ms (detailed breakdown, no timeRange)
 * @returns Query result with Bids per Round data
 */
export function useBidsPerRound(): UseQueryResult<BidsPerRoundResponse, Error> {
  return useStaggeredQuery<BidsPerRoundResponse>(
    ['bids-per-round'],
    async () => {
      const data = await apiClient.getBidsPerRound()
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Query hook for fetching Express Lane Price
 * Priority: MEDIUM - Loads after 300ms (time series data)
 * @param timeRange - Time range string (5min, 15min, 30min, 1hour)
 * @returns Query result with Express Lane Price data
 */
export function useExpressLanePrice(timeRange: string = '15min'): UseQueryResult<ExpressLanePriceResponse, Error> {
  return useStaggeredQuery<ExpressLanePriceResponse>(
    ['express-lane-price', timeRange],
    async () => {
      const data = await apiClient.getExpressLanePrice(timeRange)
      return data
    },
    QueryPriority.MEDIUM,
    { refetchInterval: 60000 }
  )
}

/**
 * Hook to refresh multiple API queries
 * @param queries - Array of UseQueryResult objects to refresh
 * @returns Object with refresh function and loading state
 * 
 * @example
 * ```tsx
 * const grossMEV = useGrossMEV(timeRange)
 * const atomicMEV = useAtomicMEV(timeRange)
 * const { refresh, isRefreshing } = useApiRefresh([grossMEV, atomicMEV])
 * 
 * // Later in your component:
 * <button onClick={refresh}>Refresh Data</button>
 * ```
 */
export function useApiRefresh(
  queries: UseQueryResult<unknown, Error>[]
): {
  refresh: () => Promise<void>
  isRefreshing: boolean
} {
  const refresh = useCallback(async () => {
    await Promise.all(queries.map(query => query.refetch()))
  }, [queries])

  const isRefreshing = queries.some(query => query.isFetching)

  return { refresh, isRefreshing }
}

/**
 * Hook to refresh API queries by query keys
 * Useful when you want to refresh queries without having access to the query results
 * @param queryKeys - Array of query keys to refresh
 * @returns Object with refresh function and loading state
 * 
 * @example
 * ```tsx
 * const { refresh, isRefreshing } = useApiRefreshByKeys([
 *   ['gross-mev', '15min'],
 *   ['atomic-mev', '15min']
 * ])
 * 
 * // Later in your component:
 * <button onClick={refresh}>Refresh Data</button>
 * ```
 */
export function useApiRefreshByKeys(
  queryKeys: unknown[][]
): {
  refresh: () => Promise<void>
  isRefreshing: boolean
} {
  const queryClient = useQueryClient()

  const refresh = useCallback(async () => {
    await Promise.all(
      queryKeys.map(queryKey => queryClient.invalidateQueries({ queryKey }))
    )
  }, [queryClient, queryKeys])

  const isRefreshing = queryKeys.some(queryKey => {
    const state = queryClient.getQueryState(queryKey)
    return state?.fetchStatus === 'fetching'
  })

  return { refresh, isRefreshing }
}

/**
 * Hook to periodically refresh multiple API queries
 * @param queries - Array of UseQueryResult objects to refresh
 * @param intervalMs - Refresh interval in milliseconds (default: 30000)
 * @param enabled - Whether periodic refresh is enabled (default: true)
 * @returns Object with refresh function, loading state, and controls
 * 
 * @example
 * ```tsx
 * const grossMEV = useGrossMEV(timeRange)
 * const atomicMEV = useAtomicMEV(timeRange)
 * const { refresh, isRefreshing, pause, resume, isPaused } = usePeriodicApiRefresh(
 *   [grossMEV, atomicMEV],
 *   30000, // 30 seconds
 *   true // enabled by default
 * )
 * 
 * // Pause/resume periodic refresh
 * <button onClick={isPaused ? resume : pause}>
 *   {isPaused ? 'Resume Auto-refresh' : 'Pause Auto-refresh'}
 * </button>
 * ```
 */
export function usePeriodicApiRefresh(
  queries: UseQueryResult<unknown, Error>[],
  intervalMs: number = 30000,
  enabled: boolean = true
): {
  refresh: () => Promise<void>
  isRefreshing: boolean
  pause: () => void
  resume: () => void
  isPaused: boolean
} {
  const [isPaused, setIsPaused] = useState(!enabled)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    await Promise.all(queries.map(query => query.refetch()))
  }, [queries])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  useEffect(() => {
    if (isPaused || intervalMs <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Set up periodic refresh
    intervalRef.current = setInterval(() => {
      refresh()
    }, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPaused, intervalMs, refresh])

  const isRefreshing = queries.some(query => query.isFetching)

  return { refresh, isRefreshing, pause, resume, isPaused }
}

/**
 * Hook to periodically refresh API queries by query keys with staggered refreshes
 * Useful when you want to refresh queries without having access to the query results
 * @param queryKeys - Array of query keys to refresh, optionally with priority info
 * @param intervalMs - Refresh interval in milliseconds (default: 60000)
 * @param enabled - Whether periodic refresh is enabled (default: true)
 * @param staggerMs - Delay between each query refresh in milliseconds (default: 200)
 * @returns Object with refresh function, loading state, and controls
 * 
 * @example
 * ```tsx
 * const { refresh, isRefreshing, pause, resume, isPaused } = usePeriodicApiRefreshByKeys(
 *   [
 *     ['gross-mev', timeRange],
 *     ['atomic-mev', timeRange]
 *   ],
 *   60000, // 60 seconds
 *   true, // enabled by default
 *   200 // 200ms stagger between refreshes
 * )
 * 
 * // Pause/resume periodic refresh
 * <button onClick={isPaused ? resume : pause}>
 *   {isPaused ? 'Resume Auto-refresh' : 'Pause Auto-refresh'}
 * </button>
 * ```
 */
export function usePeriodicApiRefreshByKeys(
  queryKeys: unknown[][],
  intervalMs: number = 60000,
  enabled: boolean = true,
  staggerMs: number = 200
): {
  refresh: () => Promise<void>
  isRefreshing: boolean
  pause: () => void
  resume: () => void
  isPaused: boolean
} {
  const queryClient = useQueryClient()
  const [isPaused, setIsPaused] = useState(!enabled)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    // Stagger refreshes to avoid overwhelming the server
    for (let i = 0; i < queryKeys.length; i++) {
      queryClient.invalidateQueries({ queryKey: queryKeys[i] })
      // Wait before next refresh (except for the last one)
      if (i < queryKeys.length - 1) {
        await new Promise(resolve => setTimeout(resolve, staggerMs))
      }
    }
  }, [queryClient, queryKeys, staggerMs])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  useEffect(() => {
    if (isPaused || intervalMs <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Set up periodic refresh
    intervalRef.current = setInterval(() => {
      refresh()
    }, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPaused, intervalMs, refresh])

  const isRefreshing = queryKeys.some(queryKey => {
    const state = queryClient.getQueryState(queryKey)
    return state?.fetchStatus === 'fetching'
  })

  return { refresh, isRefreshing, pause, resume, isPaused }
}

/**
 * Query hook for fetching atomic arbitrage data by transaction hash
 * @param txHash - Transaction hash
 * @returns Query result with atomic arbitrage data
 */
export function useAtomicArb(txHash: string): UseQueryResult<AtomicArbResponse, Error> {
  return useQuery({
    queryKey: ['atomic-arb', txHash],
    queryFn: async () => {
      const data = await apiClient.getAtomicArb(txHash)
      return data
    },
    enabled: !!txHash, // Only run query if txHash is provided
  })
}

/**
 * Query hook for fetching CexDex quote data by transaction hash
 * @param txHash - Transaction hash
 * @returns Query result with CexDex quote data
 */
export function useCexDexQuote(txHash: string): UseQueryResult<CexDexQuoteResponse, Error> {
  return useQuery({
    queryKey: ['cexdex-quote', txHash],
    queryFn: async () => {
      const data = await apiClient.getCexDexQuote(txHash)
      return data
    },
    enabled: !!txHash, // Only run query if txHash is provided
  })
}

/**
 * Query hook for fetching liquidation data by transaction hash
 * @param txHash - Transaction hash
 * @returns Query result with liquidation data
 */
export function useLiquidationDetails(txHash: string): UseQueryResult<LiquidationResponse, Error> {
  return useQuery({
    queryKey: ['liquidation-details', txHash],
    queryFn: async () => {
      const data = await apiClient.getLiquidationByTxHash(txHash)
      return data
    },
    enabled: !!txHash, // Only run query if txHash is provided
  })
}

