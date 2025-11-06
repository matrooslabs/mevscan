import { useNavigate } from 'react-router-dom'
import { useLiquidationDetails } from '../hooks/useApi'
import type { LiquidationResponse } from '../../shared/types'
import './MEVDetails.css'

interface LiquidationMEVDetailsProps {
  txHash: string
}

function LiquidationMEVDetails({ txHash }: LiquidationMEVDetailsProps) {
  const navigate = useNavigate()
  const { data, isLoading, error } = useLiquidationDetails(txHash)

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="mev-details-container">
        <div className="loading-state">Loading liquidation details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mev-details-container">
        <div className="error-state">
          Error loading liquidation: {error.message}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mev-details-container">
        <div className="empty-state">No liquidation data found</div>
      </div>
    )
  }

  const liquidation: LiquidationResponse = data

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
              <span className="details-label">Liquidation TX Hash:</span>
              <span className="details-value monospace">
                <a
                  href={`/transaction/${liquidation.liquidation_tx_hash}`}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/transaction/${liquidation.liquidation_tx_hash}`)
                  }}
                >
                  {liquidation.liquidation_tx_hash}
                </a>
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Block Number:</span>
              <span className="details-value">{liquidation.block_number.toLocaleString()}</span>
            </div>
            <div className="details-item">
              <span className="details-label">Profit (USD):</span>
              <span className="details-value">
                ${liquidation.profit_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Protocols:</span>
              <span className="details-value">
                {liquidation.protocols && liquidation.protocols.length > 0 ? liquidation.protocols.join(', ') : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Run ID:</span>
              <span className="details-value">{liquidation.run_id}</span>
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
                {liquidation.gas_details.gas_used ? parseInt(liquidation.gas_details.gas_used).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Effective Gas Price:</span>
              <span className="details-value monospace">
                {liquidation.gas_details.effective_gas_price || 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Priority Fee:</span>
              <span className="details-value monospace">
                {liquidation.gas_details.priority_fee || 'N/A'}
              </span>
            </div>
            <div className="details-item">
              <span className="details-label">Coinbase Transfer:</span>
              <span className="details-value monospace">
                {liquidation.gas_details.coinbase_transfer || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Liquidations */}
      {liquidation.liquidations && liquidation.liquidations.length > 0 && (
        <div className="mev-details-section">
          <div className="section-header">
            <h3>Liquidations ({liquidation.liquidations.length})</h3>
          </div>
          <div className="section-content">
            <div className="liquidations-list">
              {liquidation.liquidations.map((liq, index) => (
                <div key={index} className="liquidation-item">
                  <div className="liquidation-header">
                    <span className="liquidation-index">Liquidation #{index + 1}</span>
                    <span className="liquidation-trace-idx">Trace Index: {liq.trace_idx}</span>
                  </div>
                  <div className="liquidation-details">
                    <div className="liquidation-detail-row">
                      <span className="liquidation-label">Pool:</span>
                      <span className="liquidation-value monospace">
                        <a
                          href={`/address/${liq.pool}`}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(`/address/${liq.pool}`)
                          }}
                        >
                          {formatAddress(liq.pool)}
                        </a>
                      </span>
                    </div>
                    <div className="liquidation-detail-row">
                      <span className="liquidation-label">Liquidator:</span>
                      <span className="liquidation-value monospace">
                        <a
                          href={`/address/${liq.liquidator}`}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(`/address/${liq.liquidator}`)
                          }}
                        >
                          {formatAddress(liq.liquidator)}
                        </a>
                      </span>
                    </div>
                    <div className="liquidation-detail-row">
                      <span className="liquidation-label">Debtor:</span>
                      <span className="liquidation-value monospace">
                        <a
                          href={`/address/${liq.debtor}`}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(`/address/${liq.debtor}`)
                          }}
                        >
                          {formatAddress(liq.debtor)}
                        </a>
                      </span>
                    </div>
                    <div className="liquidation-detail-row">
                      <span className="liquidation-label">Collateral Asset:</span>
                      <span className="liquidation-value monospace">
                        {liq.collateral_asset[0]} ({liq.collateral_asset[1]})
                      </span>
                    </div>
                    <div className="liquidation-detail-row">
                      <span className="liquidation-label">Debt Asset:</span>
                      <span className="liquidation-value monospace">
                        {liq.debt_asset[0]} ({liq.debt_asset[1]})
                      </span>
                    </div>
                    <div className="liquidation-detail-row">
                      <span className="liquidation-label">Covered Debt:</span>
                      <span className="liquidation-value monospace">
                        {liq.covered_debt[0]} {liq.covered_debt[1]}
                      </span>
                    </div>
                    <div className="liquidation-detail-row">
                      <span className="liquidation-label">Liquidated Collateral:</span>
                      <span className="liquidation-value monospace">
                        {liq.liquidated_collateral[0]} {liq.liquidated_collateral[1]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liquidation Swaps */}
      {liquidation.liquidation_swaps && liquidation.liquidation_swaps.length > 0 && (
        <div className="mev-details-section">
          <div className="section-header">
            <h3>Liquidation Swaps ({liquidation.liquidation_swaps.length})</h3>
          </div>
          <div className="section-content">
            <div className="swaps-list">
              {liquidation.liquidation_swaps.map((swap, index) => (
                <div key={index} className="swap-item">
                  <div className="swap-header">
                    <span className="swap-index">Swap #{index + 1}</span>
                    <span className="swap-trace-idx">Trace Index: {swap.trace_idx}</span>
                  </div>
                  <div className="swap-details">
                    <div className="swap-detail-row">
                      <span className="swap-label">From:</span>
                      <span className="swap-value monospace">
                        <a
                          href={`/address/${swap.from}`}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(`/address/${swap.from}`)
                          }}
                        >
                          {formatAddress(swap.from)}
                        </a>
                      </span>
                    </div>
                    <div className="swap-detail-row">
                      <span className="swap-label">Recipient:</span>
                      <span className="swap-value monospace">
                        <a
                          href={`/address/${swap.recipient}`}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(`/address/${swap.recipient}`)
                          }}
                        >
                          {formatAddress(swap.recipient)}
                        </a>
                      </span>
                    </div>
                    <div className="swap-detail-row">
                      <span className="swap-label">Pool:</span>
                      <span className="swap-value monospace">
                        <a
                          href={`/address/${swap.pool}`}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(`/address/${swap.pool}`)
                          }}
                        >
                          {formatAddress(swap.pool)}
                        </a>
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

export default LiquidationMEVDetails

