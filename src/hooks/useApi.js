/**
 * @typedef {import('../../shared/types').Transaction} Transaction
 * @typedef {import('../../shared/types').Block} Block
 * @typedef {import('../../shared/types').BlockListItem} BlockListItem
 * @typedef {import('../../shared/types').Address} Address
 */

import { useQuery } from '@tanstack/react-query'
import ApiClient from '../services/apiClient'

// Initialize API client - you may want to configure this based on your environment
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001')

/**
 * Query hook for fetching latest blocks
 * @param {number} [limit] - Optional limit for number of blocks to retrieve (default: 20)
 * @returns {ReturnType<typeof useQuery<BlockListItem[]>>}
 */
export function useLatestBlocks(limit) {
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
 * @param {number} [limit] - Optional limit for number of transactions to retrieve (default: 20)
 * @returns {ReturnType<typeof useQuery<Transaction[]>>}
 */
export function useLatestTransactions(limit) {
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
 * @param {string} blockId
 * @returns {ReturnType<typeof useQuery<Block>>}
 */
export function useBlock(blockId) {
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
 * @param {string} transactionId
 * @returns {ReturnType<typeof useQuery<Transaction>>}
 */
export function useTransaction(transactionId) {
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
 * @param {string} address
 * @returns {ReturnType<typeof useQuery<Address>>}
 */
export function useAddress(address) {
  return useQuery({
    queryKey: ['addresses', address],
    queryFn: async () => {
      const data = await apiClient.getAddress(address)
      return data
    },
    enabled: !!address, // Only run query if address is provided
  })
}

