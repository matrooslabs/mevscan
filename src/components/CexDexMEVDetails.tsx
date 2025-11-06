import { useNavigate, Link } from 'react-router-dom'
import { useCexDexQuote } from '../hooks/useApi'
import type { CexDexQuoteResponse } from '../../shared/types'
import './MEVDetails.css'

interface CexDexMEVDetailsProps {
  txHash: string
}

function CexDexMEVDetails({ txHash }: CexDexMEVDetailsProps) {
  const navigate = useNavigate()
  const { data, isLoading, error } = useCexDexQuote(txHash)

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="mev-details-container">
        <div className="loading-state">Loading CexDex quote details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mev-details-container">
        <div className="error-state">
          Error loading CexDex quote: {error.message}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mev-details-container">
        <div className="empty-state">No CexDex quote data found</div>
      </div>
    )
  }

  const quote: CexDexQuoteResponse = data

  return (
    <div className="mev-details-container">
      {/* General Information */}
      <div className="mev-details-section">
        <div className="section-header">
          <h3>General Information</h3>
        </div>
        <div className="section-content">
          <div className="details-grid">
            <div className="details-item">
              <span className="details-label">Transaction Hash:</span>
              <span className="details-value monospace">
                <Link to={`/transaction/${quote.tx_hash}`}>
                  {quote.tx_hash}
                </Link>
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Block Number:</span>
              <span className="details-value">{quote.block_number.toLocaleString()}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Block Timestamp:</span>
              <span className="details-value">
                {formatTimestamp(quote.block_timestamp)}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Exchange:</span>
              <span className="details-value">{quote.exchange}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Profit (USD):</span>
              <span className="details-value">
                ${quote.profit_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">PnL:</span>
              <span className="details-value">
                {quote.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Protocols:</span>
              <span className="details-value">
                {quote.protocols && quote.protocols.length > 0 ? quote.protocols.join(', ') : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Run ID:</span>
              <span className="details-value">{quote.run_id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mid Price Information */}
      <div className="mev-details-section">
        <div className="section-header">
          <h3>Mid Price Information</h3>
        </div>
        <div className="section-content">
          <div className="details-grid">
            <div className="details-item">
              <span className="details-label">Instant Mid Price:</span>
              <span className="details-value">
                {quote.instant_mid_price && quote.instant_mid_price.length > 0
                  ? quote.instant_mid_price.map(p => p.toFixed(6)).join(', ')
                  : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">T2 Mid Price:</span>
              <span className="details-value">
                {quote.t2_mid_price && quote.t2_mid_price.length > 0
                  ? quote.t2_mid_price.map(p => p.toFixed(6)).join(', ')
                  : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">T12 Mid Price:</span>
              <span className="details-value">
                {quote.t12_mid_price && quote.t12_mid_price.length > 0
                  ? quote.t12_mid_price.map(p => p.toFixed(6)).join(', ')
                  : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">T30 Mid Price:</span>
              <span className="details-value">
                {quote.t30_mid_price && quote.t30_mid_price.length > 0
                  ? quote.t30_mid_price.map(p => p.toFixed(6)).join(', ')
                  : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">T60 Mid Price:</span>
              <span className="details-value">
                {quote.t60_mid_price && quote.t60_mid_price.length > 0
                  ? quote.t60_mid_price.map(p => p.toFixed(6)).join(', ')
                  : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">T300 Mid Price:</span>
              <span className="details-value">
                {quote.t300_mid_price && quote.t300_mid_price.length > 0
                  ? quote.t300_mid_price.map(p => p.toFixed(6)).join(', ')
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gas Details */}
      <div className="mev-details-section">
        <div className="section-header">
          <h3>Gas Details</h3>
        </div>
        <div className="section-content">
          <div className="details-grid">
            <div className="details-item">
              <span className="details-label">Gas Used:</span>
              <span className="details-value">
                {quote.gas_details.gas_used ? parseInt(quote.gas_details.gas_used).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Effective Gas Price:</span>
              <span className="details-value monospace">
                {quote.gas_details.effective_gas_price || 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Priority Fee:</span>
              <span className="details-value monospace">
                {quote.gas_details.priority_fee || 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Coinbase Transfer:</span>
              <span className="details-value monospace">
                {quote.gas_details.coinbase_transfer || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Swaps */}
      {quote.swaps && quote.swaps.length > 0 && (
        <div className="mev-details-section">
          <div className="section-header">
            <h3>Swaps ({quote.swaps.length})</h3>
          </div>
          <div className="section-content">
            <div className="swaps-list">
              {quote.swaps.map((swap, index) => (
                <div key={index} className="swap-item">
                  <div className="swap-header">
                    <span className="swap-index">Swap #{index + 1}</span>
                    <span className="swap-trace-idx">Trace Index: {swap.trace_idx}</span>
                  </div>
                  <div className="swap-details">
                    <div className="swap-detail-row">
                      <span className="swap-label">From:</span>
                      <span className="swap-value monospace">
                        <Link to={`/address/${swap.from}`}>
                          {formatAddress(swap.from)}
                        </Link>
                      </span>
                    </div>
                    <div className="swap-detail-row">
                      <span className="swap-label">Recipient:</span>
                      <span className="swap-value monospace">
                        <Link to={`/address/${swap.recipient}`}>
                          {formatAddress(swap.recipient)}
                        </Link>
                      </span>
                    </div>
                    <div className="swap-detail-row">
                      <span className="swap-label">Pool:</span>
                      <span className="swap-value monospace">
                        <Link to={`/address/${swap.pool}`}>
                          {formatAddress(swap.pool)}
                        </Link>
                      </span>
                    </div>
                    <div className="swap-detail-row">
                      <span className="swap-label">Token In:</span>
                      <span className="swap-value monospace">
                        {swap.token_in[0]} ({swap.token_in[1]})
                      </span>
                    </div>
                    <div className="swap-detail-row">
                      <span className="swap-label">Token Out:</span>
                      <span className="swap-value monospace">
                        {swap.token_out[0]} ({swap.token_out[1]})
                      </span>
                    </div>
                    <div className="swap-detail-row">
                      <span className="swap-label">Amount In:</span>
                      <span className="swap-value monospace">
                        {swap.amount_in[0]} {swap.amount_in[1]}
                      </span>
                    </div>
                    <div className="swap-detail-row">
                      <span className="swap-label">Amount Out:</span>
                      <span className="swap-value monospace">
                        {swap.amount_out[0]} {swap.amount_out[1]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CexDexMEVDetails

