import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTransaction } from '../hooks/useApi'
import type { Transaction } from '../../shared/types'
import './Transaction.css'

function Transaction() {
  const { tx_hash } = useParams<{ tx_hash: string }>()
  const navigate = useNavigate()
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const {
    data: transactionData,
    isLoading,
    error,
  } = useTransaction(tx_hash || '')

  if (isLoading) {
    return (
      <div className="transaction-page-container">
        <div className="loading-state">Loading transaction...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="transaction-page-container">
        <div className="error-state">
          Error loading transaction: {error.message}
        </div>
      </div>
    )
  }

  const transaction: Transaction = transactionData || {
    hash: tx_hash || '0x0000...0000',
    blockNumber: 0,
    profit: 0,
    mevType: 'N/A',
    timeboosted: false,
    expressLaneController: null,
    expressLanePrice: null,
    expressLaneRound: null,
    from: 'N/A',
    to: null,
    value: '0',
    time: 'N/A',
    gas: '0',
    gasPrice: '0',
    status: 'unknown',
  }

  const formatHash = (hash: string) => {
    if (!hash || hash.length < 12) return hash
    return `${hash.slice(0, 12)}...`
  }

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text: string, hashType: 'txHash') => {
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
    <div className="transaction-page-container">
      {/* Header */}
      <div className="transaction-header">
        <div className="transaction-header-content">
          <button
            onClick={() => navigate('/')}
            className="back-button"
          >
            ← Back
          </button>
          <div className="transaction-title-section">
            <h1 className="transaction-title">Transaction</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="transaction-content">
        {/* Overview Section */}
        <div className="transaction-section">
          <div className="section-header">
            <h2>Overview</h2>
          </div>
          <div className="section-content">
            {/* Transaction Hash - Full Width */}
            <div className="overview-item-full">
              <span className="overview-label">Transaction Hash:</span>
              <span className="overview-value monospace">
                <span className="hash-full">{transaction.hash}</span>
                <button 
                  className={`copy-button ${copiedHash === 'txHash' ? 'copied' : ''}`}
                  title={copiedHash === 'txHash' ? 'Copied!' : 'Copy hash'}
                  onClick={() => copyToClipboard(transaction.hash, 'txHash')}
                >
                  {copiedHash === 'txHash' ? (
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
                <a
                  href={`https://arbiscan.io/tx/${transaction.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link-button"
                  title="View on Etherscan"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10.5 3.5H11.5C12.0523 3.5 12.5 3.94772 12.5 4.5V11.5C12.5 12.0523 12.0523 12.5 11.5 12.5H2.5C1.94772 12.5 1.5 12.0523 1.5 11.5V2.5C1.5 1.94772 1.94772 1.5 2.5 1.5H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M9.5 1.5H12.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M7.5 6.5L12.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </a>
              </span>
            </div>
            <div className="overview-grid">
              <div className="overview-item">
                <span className="overview-label">From:</span>
                <span className="overview-value monospace">
                  {transaction.from ? (
                    <a href={`/address/${transaction.from}`} onClick={(e) => {
                      e.preventDefault()
                      navigate(`/address/${transaction.from}`)
                    }}>
                      {formatAddress(transaction.from)}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">To:</span>
                <span className="overview-value monospace">
                  {transaction.to ? (
                    <a href={`/address/${transaction.to}`} onClick={(e) => {
                      e.preventDefault()
                      navigate(`/address/${transaction.to}`)
                    }}>
                      {formatAddress(transaction.to)}
                    </a>
                  ) : (
                    'Contract Creation'
                  )}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Profit (USD):</span>
                <span className="overview-value">
                  {transaction.profit !== undefined 
                    ? `$${transaction.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'N/A'}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Gas Used:</span>
                <span className="overview-value">
                  {transaction.gas ? parseInt(transaction.gas).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Timeboosted:</span>
                <span className="overview-value">
                  {transaction.timeboosted ? (
                    <span className="timeboosted-badge">Yes</span>
                  ) : (
                    <span className="timeboosted-no">No</span>
                  )}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Express Lane Controller:</span>
                <span className="overview-value monospace">
                  {transaction.expressLaneController ? (
                    <a href={`/address/${transaction.expressLaneController}`} onClick={(e) => {
                      e.preventDefault()
                      navigate(`/address/${transaction.expressLaneController}`)
                    }}>
                      {formatAddress(transaction.expressLaneController)}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MEV Overview Section */}
        <div className="transaction-section">
          <div className="section-header">
            <h2>MEV Overview</h2>
          </div>
          <div className="section-content">
            <div className="empty-state">
              MEV Overview section coming soon
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Transaction
