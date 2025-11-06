import { useState, useEffect } from 'react'
import { createWalletClient, custom, getAddress, type Address } from 'viem'
import { mainnet } from 'viem/chains'

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, handler: (accounts: string[]) => void) => void
      removeListener: (event: string, handler: (accounts: string[]) => void) => void
    }
  }
}

// Helper function to format address
function formatAddress(address: Address | null): string | null {
  if (!address) return null
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface UseWalletReturn {
  account: Address | null
  formattedAddress: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

export function useWallet(): UseWalletReturn {
  const [account, setAccount] = useState<Address | null>(null)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
          if (accounts.length > 0) {
            setAccount(getAddress(accounts[0]))
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err)
        }
      }
    }
    checkConnection()

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(getAddress(accounts[0]))
      } else {
        setAccount(null)
      }
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [])

  const connect = async (): Promise<void> => {
    setIsConnecting(true)
    setError(null)

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No Ethereum wallet found. Please install MetaMask or another Web3 wallet.')
      }

      const client = createWalletClient({
        chain: mainnet,
        transport: custom(window.ethereum),
      })

      const [address] = await client.requestAddresses()
      setAccount(address)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      console.error('Wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = (): void => {
    setAccount(null)
    setError(null)
  }

  return {
    account,
    formattedAddress: formatAddress(account),
    isConnected: !!account,
    isConnecting,
    error,
    connect,
    disconnect,
  }
}

