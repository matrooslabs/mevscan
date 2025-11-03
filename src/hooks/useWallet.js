import { useState, useEffect } from 'react'
import { createWalletClient, custom, getAddress } from 'viem'
import { mainnet } from 'viem/chains'

// Helper function to format address
function formatAddress(address) {
  if (!address) return null
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function useWallet() {
  const [account, setAccount] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
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
    const handleAccountsChanged = (accounts) => {
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

  const connect = async () => {
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
      setError(err.message || 'Failed to connect wallet')
      console.error('Wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
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
