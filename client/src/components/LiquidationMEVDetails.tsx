import { Link } from 'react-router-dom';
import { useLiquidationDetails } from '../hooks/useApi';
import type { LiquidationResponse, LiquidationInfo, LiquidationSwapInfo } from '@mevscan/shared';
import './MEVDetails.css';

interface LiquidationMEVDetailsProps {
  txHash: string;
}

function LiquidationMEVDetails({ txHash }: LiquidationMEVDetailsProps) {
  const { data, isLoading, error } = useLiquidationDetails(txHash);

  if (isLoading) {
    return <div className="mev-details-loading">Loading liquidation details...</div>;
  }

  if (error) {
    return <div className="mev-details-error">Error loading MEV details: {error.message}</div>;
  }

  if (!data) {
    return <div className="mev-details-empty">No liquidation data found</div>;
  }

  const liq: LiquidationResponse = data;

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="mev-details">
      <div className="mev-details-summary">
        <div className="mev-detail-row">
          <span className="mev-detail-label">Type:</span>
          <span className="mev-detail-value mev-type-badge-liquidation">Liquidation</span>
        </div>
        <div className="mev-detail-row">
          <span className="mev-detail-label">Profit:</span>
          <span className="mev-detail-value mev-profit">
            ${liq.profit_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mev-detail-row">
          <span className="mev-detail-label">Block:</span>
          <span className="mev-detail-value">
            <Link to={`/blocks/${liq.block_number}`}>{liq.block_number.toLocaleString()}</Link>
          </span>
        </div>
        {liq.protocols.length > 0 && (
          <div className="mev-detail-row">
            <span className="mev-detail-label">Protocols:</span>
            <span className="mev-detail-value">
              {liq.protocols.map((proto: string, i: number) => (
                <span key={i} className="protocol-badge">{proto}</span>
              ))}
            </span>
          </div>
        )}
      </div>

      {/* Gas Details */}
      <div className="mev-section-block">
        <h3 className="mev-section-title">Gas Details</h3>
        <div className="mev-details-grid">
          <div className="mev-detail-row">
            <span className="mev-detail-label">Gas Used:</span>
            <span className="mev-detail-value">{parseInt(liq.gas_details.gas_used).toLocaleString()}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">Effective Gas Price:</span>
            <span className="mev-detail-value">{liq.gas_details.effective_gas_price}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">Priority Fee:</span>
            <span className="mev-detail-value">{liq.gas_details.priority_fee}</span>
          </div>
          {liq.gas_details.coinbase_transfer && (
            <div className="mev-detail-row">
              <span className="mev-detail-label">Coinbase Transfer:</span>
              <span className="mev-detail-value">{liq.gas_details.coinbase_transfer}</span>
            </div>
          )}
        </div>
      </div>

      {/* Liquidations */}
      {liq.liquidations.length > 0 && (
        <div className="mev-section-block">
          <h3 className="mev-section-title">Liquidations ({liq.liquidations.length})</h3>
          <div className="swaps-list">
            {liq.liquidations.map((liquidation: LiquidationInfo, index: number) => (
              <div key={index} className="swap-card">
                <div className="swap-header">Liquidation #{index + 1}</div>
                <div className="swap-details">
                  <div className="mev-detail-row">
                    <span className="mev-detail-label">Pool:</span>
                    <span className="mev-detail-value monospace">
                      <Link to={`/address/${liquidation.pool}`}>{formatAddress(liquidation.pool)}</Link>
                    </span>
                  </div>
                  <div className="mev-detail-row">
                    <span className="mev-detail-label">Liquidator:</span>
                    <span className="mev-detail-value monospace">
                      <Link to={`/address/${liquidation.liquidator}`}>{formatAddress(liquidation.liquidator)}</Link>
                    </span>
                  </div>
                  <div className="mev-detail-row">
                    <span className="mev-detail-label">Debtor:</span>
                    <span className="mev-detail-value monospace">
                      <Link to={`/address/${liquidation.debtor}`}>{formatAddress(liquidation.debtor)}</Link>
                    </span>
                  </div>
                  <div className="mev-detail-row">
                    <span className="mev-detail-label">Collateral Asset:</span>
                    <span className="mev-detail-value">
                      {liquidation.liquidated_collateral[1]} <span className="token-symbol">{liquidation.collateral_asset[1]}</span>
                    </span>
                  </div>
                  <div className="mev-detail-row">
                    <span className="mev-detail-label">Debt Asset:</span>
                    <span className="mev-detail-value">
                      {liquidation.covered_debt[1]} <span className="token-symbol">{liquidation.debt_asset[1]}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liquidation Swaps */}
      {liq.liquidation_swaps.length > 0 && (
        <div className="mev-section-block">
          <h3 className="mev-section-title">Swaps ({liq.liquidation_swaps.length})</h3>
          <div className="swaps-list">
            {liq.liquidation_swaps.map((swap: LiquidationSwapInfo, index: number) => (
              <div key={index} className="swap-card">
                <div className="swap-header">Swap #{index + 1}</div>
                <div className="swap-details">
                  <div className="mev-detail-row">
                    <span className="mev-detail-label">Pool:</span>
                    <span className="mev-detail-value monospace">
                      <Link to={`/address/${swap.pool}`}>{formatAddress(swap.pool)}</Link>
                    </span>
                  </div>
                  <div className="mev-detail-row">
                    <span className="mev-detail-label">From:</span>
                    <span className="mev-detail-value monospace">
                      <Link to={`/address/${swap.from}`}>{formatAddress(swap.from)}</Link>
                    </span>
                  </div>
                  <div className="mev-detail-row">
                    <span className="mev-detail-label">Recipient:</span>
                    <span className="mev-detail-value monospace">
                      <Link to={`/address/${swap.recipient}`}>{formatAddress(swap.recipient)}</Link>
                    </span>
                  </div>
                  <div className="mev-detail-row">
                    <span className="mev-detail-label">Token In:</span>
                    <span className="mev-detail-value">
                      {swap.amount_in[1]} <span className="token-symbol">{swap.token_in[1]}</span>
                    </span>
                  </div>
                  <div className="mev-detail-row">
                    <span className="mev-detail-label">Token Out:</span>
                    <span className="mev-detail-value">
                      {swap.amount_out[1]} <span className="token-symbol">{swap.token_out[1]}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiquidationMEVDetails;
