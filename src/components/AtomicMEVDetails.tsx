import { useNavigate, Link } from 'react-router-dom'
import { useAtomicArb } from '../hooks/useApi'
import type { AtomicArbResponse } from '../../shared/types'
import './MEVDetails.css'

interface AtomicMEVDetailsProps {
  txHash: string
}

function AtomicMEVDetails({ txHash }: AtomicMEVDetailsProps) {
  const navigate = useNavigate()
  const { data, isLoading, error } = useAtomicArb(txHash)

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="mev-details-container">
        <div className="loading-state">Loading atomic arbitrage details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mev-details-container">
        <div className="error-state">
          Error loading atomic arbitrage: {error.message}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mev-details-container">
        <div className="empty-state">No atomic arbitrage data found</div>
      </div>
    )
  }

  const arb: AtomicArbResponse = data

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
                <Link to={`/transaction/${arb.tx_hash}`}>
                  {arb.tx_hash}
                </Link>
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Block Number:</span>
              <span className="details-value">{arb.block_number.toLocaleString()}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Trigger TX:</span>
              <span className="details-value monospace">
                <Link to={`/transaction/${arb.trigger_tx}`}>
                  {formatAddress(arb.trigger_tx)}
                </Link>
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Arbitrage Type:</span>
              <span className="details-value">{arb.arb_type}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Profit (USD):</span>
              <span className="details-value">
                ${arb.profit_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Protocols:</span>
              <span className="details-value">
                {arb.protocols && arb.protocols.length > 0 ? arb.protocols.join(', ') : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Run ID:</span>
              <span className="details-value">{arb.run_id}</span>
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
                {arb.gas_details.gas_used ? parseInt(arb.gas_details.gas_used).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Effective Gas Price:</span>
              <span className="details-value monospace">
                {arb.gas_details.effective_gas_price || 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Priority Fee:</span>
              <span className="details-value monospace">
                {arb.gas_details.priority_fee || 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Coinbase Transfer:</span>
              <span className="details-value monospace">
                {arb.gas_details.coinbase_transfer || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Swaps */}
      {arb.swaps && arb.swaps.length > 0 && (
        <div className="mev-details-section">
          <div className="section-header">
            <h3>Swaps ({arb.swaps.length})</h3>
          </div>
          <div className="section-content">
            <div className="swaps-list">
              {arb.swaps.map((swap, index) => (
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

export default AtomicMEVDetails

