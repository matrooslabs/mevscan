import { useParams, useNavigate } from 'react-router-dom'
import { useBlock } from '../hooks/useApi'
import type { Block } from '../../shared/types'
import './Block.css'

interface BlockWithExtended extends Block {
  parentHash?: string;
  gasLimit?: string;
  baseFeePerGas?: string;
  fullMinerAddress?: string;
}

function Block() {
  const { block_number } = useParams<{ block_number: string }>()
  const navigate = useNavigate()
  const {
    data: blockData,
    isLoading,
    error,
  } = useBlock(block_number || '')

  if (isLoading) {
    return (
      <div className="block-page-container">
        <div className="loading-state">Loading block...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="block-page-container">
        <div className="error-state">
          Error loading block: {error.message}
        </div>
      </div>
    )
  }

  const block: BlockWithExtended = blockData || {
    number: parseInt(block_number || '0', 10),
    hash: '0x0000...0000',
    timestamp: 'N/A',
    miner: 'Unknown',
    minerAddress: '0x0000...0000',
    expressLaneTxns: 0,
    totalTxns: 0,
    timeTaken: 'N/A',
    ethValue: '0',
    gasUsed: '0',
  }

  const formatHash = (hash: string) => {
    if (!hash || hash.length < 12) return hash
    return `${hash.slice(0, 12)}...`
  }

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="block-page-container">
      {/* Header */}
      <div className="block-header">
        <div className="block-header-content">
          <button
            onClick={() => navigate('/')}
            className="back-button"
          >
            ← Back
          </button>
          <div className="block-title-section">
            <h1 className="block-title">Block #{block.number?.toLocaleString() || block_number}</h1>
            <span className="block-status">Finalized</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="block-content">
        {/* Overview Section */}
        <div className="block-section">
          <div className="section-header">
            <h2>Overview</h2>
          </div>
          <div className="section-content">
            <div className="overview-grid">
              <div className="overview-item">
                <span className="overview-label">Timestamp:</span>
                <span className="overview-value">{block.timestamp || 'N/A'}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Transactions:</span>
                <span className="overview-value">
                  {block.totalTxns || 0} {block.totalTxns === 1 ? 'transaction' : 'transactions'}
                  {block.expressLaneTxns !== undefined && block.expressLaneTxns > 0 && (
                    <span className="express-lane-badge"> ({block.expressLaneTxns} Express Lane)</span>
                  )}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Gas Used:</span>
                <span className="overview-value">
                  {typeof block.gasUsed === 'string' ? block.gasUsed : block.gasUsed?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Gas Limit:</span>
                <span className="overview-value">
                  {block.gasLimit ? parseInt(block.gasLimit).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Base Fee Per Gas:</span>
                <span className="overview-value">{block.baseFeePerGas || 'N/A'}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Eth Value:</span>
                <span className="overview-value">{block.ethValue || '0'} ETH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Block Details */}
        <div className="block-section">
          <div className="section-header">
            <h2>Block Details</h2>
          </div>
          <div className="section-content">
            <div className="details-table">
              <div className="details-row">
                <div className="details-label">Block Height:</div>
                <div className="details-value">{block.number?.toLocaleString() || block_number}</div>
              </div>
              <div className="details-row">
                <div className="details-label">Block Hash:</div>
                <div className="details-value monospace">
                  <span className="hash-full">{block.hash}</span>
                  <button className="copy-button" title="Copy hash">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M9.5 1H2.5C1.67157 1 1 1.67157 1 2.5V9.5C1 10.3284 1.67157 11 2.5 11H4.5V12.5C4.5 13.3284 5.17157 14 6 14H11.5C12.3284 14 13 13.3284 13 12.5V5.5C13 4.67157 12.3284 4 11.5 4H9.5V1Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M9.5 1V4H13" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </button>
                </div>
              </div>
              {block.parentHash && (
                <div className="details-row">
                  <div className="details-label">Parent Hash:</div>
                  <div className="details-value monospace">
                    <span className="hash-full">{formatHash(block.parentHash)}</span>
                    <button className="copy-button" title="Copy hash">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9.5 1H2.5C1.67157 1 1 1.67157 1 2.5V9.5C1 10.3284 1.67157 11 2.5 11H4.5V12.5C4.5 13.3284 5.17157 14 6 14H11.5C12.3284 14 13 13.3284 13 12.5V5.5C13 4.67157 12.3284 4 11.5 4H9.5V1Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M9.5 1V4H13" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              {block.number && block.number > 0 && (
                <div className="details-row">
                  <div className="details-label">Parent Block:</div>
                  <div className="details-value">
                    <a href={`/blocks/${block.number - 1}`} onClick={(e) => {
                      e.preventDefault()
                      navigate(`/blocks/${block.number - 1}`)
                    }}>
                      Block #{((block.number - 1) || 0).toLocaleString()}
                    </a>
                  </div>
                </div>
              )}
              {block.minerAddress && (
                <div className="details-row">
                  <div className="details-label">Miner:</div>
                  <div className="details-value">
                    {block.miner || 'Unknown'}
                    {block.minerAddress !== '0x0000000000000000000000000000000000000000' && (
                      <span className="monospace address-link" onClick={() => navigate(`/address/${block.minerAddress}`)}>
                        {' '}{formatAddress(block.minerAddress)}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {block.timeTaken && (
                <div className="details-row">
                  <div className="details-label">Time Taken:</div>
                  <div className="details-value">{block.timeTaken}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        {block.bundles && block.bundles.length > 0 && (
          <div className="block-section">
            <div className="section-header">
              <h2>Transactions</h2>
              <span className="transaction-count">{block.bundles.length} {block.bundles.length === 1 ? 'transaction' : 'transactions'}</span>
            </div>
            <div className="section-content">
              <div className="transactions-table">
                <div className="transactions-table-header">
                  <div className="tx-col-hash">Hash</div>
                  <div className="tx-col-mev-contract">MEV Contract</div>
                  <div className="tx-col-mev-type">MEV Type</div>
                  <div className="tx-col-timeboosted">Timeboosted</div>
                </div>
                <div className="transactions-list">
                  {block.bundles.map((bundle) => (
                    <div key={bundle.txHash} className="transaction-row">
                      <div className="transaction-hash monospace">
                        <a href={`/transaction/${bundle.txHash}`} onClick={(e) => {
                          e.preventDefault()
                          navigate(`/transaction/${bundle.txHash}`)
                        }}>
                          {formatHash(bundle.txHash)}
                        </a>
                      </div>
                      <div className="transaction-mev-contract monospace">
                        {bundle.mevContract ? formatAddress(bundle.mevContract) : '—'}
                      </div>
                      <div className="transaction-mev-type">
                        {bundle.mevType || '—'}
                      </div>
                      <div className="transaction-timeboosted">
                        {bundle.timeboosted ? (
                          <span className="timeboosted-badge">Yes</span>
                        ) : (
                          <span className="timeboosted-no">No</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Block
