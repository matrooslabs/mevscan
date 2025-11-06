import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAddress } from '../hooks/useApi'
import type { Address as AddressType } from '../../shared/types'
import './Address.css'

function Address() {
  const { address } = useParams<{ address: string }>()
  const navigate = useNavigate()
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const {
    data: addressData,
    isLoading,
    error,
  } = useAddress(address || '')

  if (isLoading) {
    return (
      <div className="address-page-container">
        <div className="loading-state">Loading address...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="address-page-container">
        <div className="error-state">
          Error loading address: {error.message}
        </div>
      </div>
    )
  }

  const addr: AddressType = addressData || {
    address: address || '',
    balance: '0',
    balanceInEth: '0',
    ethBalance: '0',
    transactionCount: 0,
    code: null,
    isContract: false,
    transactions: [],
    firstSeen: undefined,
    lastSeen: undefined,
  }

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyToClipboard = async (text: string, hashType: 'address') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedHash(hashType)
      setTimeout(() => {
        setCopiedHash(null)
      }, 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedHash(hashType)
        setTimeout(() => {
          setCopiedHash(null)
        }, 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="address-page-container">
      {/* Header */}
      <div className="address-header">
        <div className="address-header-content">
          <button
            onClick={() => navigate('/')}
            className="back-button"
          >
            ← Back
          </button>
          <div className="address-title-section">
            <h1 className="address-title">Address</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="address-content">
        {/* Overview Section */}
        <div className="address-section">
          <div className="section-header">
            <h2>Overview</h2>
          </div>
          <div className="section-content">
            {/* Address Hash - Full Width */}
            <div className="overview-item-full">
              <span className="overview-label">Address:</span>
              <span className="overview-value monospace">
                <span className="hash-full">{addr.address}</span>
                <button 
                  className={`copy-button ${copiedHash === 'address' ? 'copied' : ''}`}
                  title={copiedHash === 'address' ? 'Copied!' : 'Copy address'}
                  onClick={() => copyToClipboard(addr.address, 'address')}
                >
                  {copiedHash === 'address' ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M11.6667 3.5L5.25 9.91667L2.33334 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M9.5 1H2.5C1.67157 1 1 1.67157 1 2.5V9.5C1 10.3284 1.67157 11 2.5 11H4.5V12.5C4.5 13.3284 5.17157 14 6 14H11.5C12.3284 14 13 13.3284 13 12.5V5.5C13 4.67157 12.3284 4 11.5 4H9.5V1Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M9.5 1V4H13" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  )}
                </button>
              </span>
            </div>
            <div className="overview-grid">
              <div className="overview-item">
                <span className="overview-label">Balance:</span>
                <span className="overview-value">
                  {addr.ethBalance || addr.balanceInEth || addr.balance || '0'} ETH
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Transaction Count:</span>
                <span className="overview-value">
                  {addr.transactionCount?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Type:</span>
                <span className="overview-value">
                  {addr.isContract ? (
                    <span className="contract-badge">Contract</span>
                  ) : (
                    <span className="eoa-badge">EOA</span>
                  )}
                </span>
              </div>
              {addr.firstSeen && (
                <div className="overview-item">
                  <span className="overview-label">First Seen:</span>
                  <span className="overview-value">{addr.firstSeen}</span>
                </div>
              )}
              {addr.lastSeen && (
                <div className="overview-item">
                  <span className="overview-label">Last Seen:</span>
                  <span className="overview-value">{addr.lastSeen}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Address
