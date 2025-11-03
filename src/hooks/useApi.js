import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ApiClient from '../services/apiClient'

// Initialize API client - you may want to configure this based on your environment
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')

/**
 * Query hook for fetching latest blocks
 */
export function useLatestBlocks() {
  return useQuery({
    queryKey: ['blocks', 'latest'],
    queryFn: async () => {
      const data = await apiClient.getLatestBlocks()
      return data
    },
    refetchInterval: 12000, // Refetch every 12 seconds for real-time updates
  })
}

/**
 * Query hook for fetching latest transactions
 */
export function useLatestTransactions() {
  return useQuery({
    queryKey: ['transactions', 'latest'],
    queryFn: async () => {
      const data = await apiClient.getLatestTransactions()
      return data
    },
    refetchInterval: 12000, // Refetch every 12 seconds for real-time updates
  })
}

/**
 * Query hook for fetching a specific block
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

