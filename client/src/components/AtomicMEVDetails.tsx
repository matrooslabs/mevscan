import { Link } from 'react-router-dom';
import { useAtomicArb } from '../hooks/useApi';
import type { AtomicArbResponse, SwapInfo } from '@mevscan/shared';
import './MEVDetails.css';

interface AtomicMEVDetailsProps {
  txHash: string;
}

function AtomicMEVDetails({ txHash }: AtomicMEVDetailsProps) {
  const { data, isLoading, error } = useAtomicArb(txHash);

  if (isLoading) {
    return <div className="mev-details-loading">Loading atomic arbitrage details...</div>;
  }

  if (error) {
    return <div className="mev-details-error">Error loading MEV details: {error.message}</div>;
  }

  if (!data) {
    return <div className="mev-details-empty">No atomic arbitrage data found</div>;
  }

  const arb: AtomicArbResponse = data;

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="mev-details">
      <div className="mev-details-summary">
        <div className="mev-detail-row">
          <span className="mev-detail-label">Type:</span>
          <span className="mev-detail-value mev-type-badge-atomic">Atomic Arbitrage</span>
        </div>
        <div className="mev-detail-row">
          <span className="mev-detail-label">Arb Type:</span>
          <span className="mev-detail-value">{arb.arb_type}</span>
        </div>
        <div className="mev-detail-row">
          <span className="mev-detail-label">Profit:</span>
          <span className="mev-detail-value mev-profit">
            ${arb.profit_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mev-detail-row">
          <span className="mev-detail-label">Block:</span>
          <span className="mev-detail-value">
            <Link to={`/blocks/${arb.block_number}`}>{arb.block_number.toLocaleString()}</Link>
          </span>
        </div>
        {arb.trigger_tx && (
          <div className="mev-detail-row">
            <span className="mev-detail-label">Trigger TX:</span>
            <span className="mev-detail-value monospace">
              <Link to={`/transaction/${arb.trigger_tx}`}>{formatAddress(arb.trigger_tx)}</Link>
            </span>
          </div>
        )}
        {arb.protocols.length > 0 && (
          <div className="mev-detail-row">
            <span className="mev-detail-label">Protocols:</span>
            <span className="mev-detail-value">
              {arb.protocols.map((proto: string, i: number) => (
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
            <span className="mev-detail-value">{parseInt(arb.gas_details.gas_used).toLocaleString()}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">Effective Gas Price:</span>
            <span className="mev-detail-value">{arb.gas_details.effective_gas_price}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">Priority Fee:</span>
            <span className="mev-detail-value">{arb.gas_details.priority_fee}</span>
          </div>
          {arb.gas_details.coinbase_transfer && (
            <div className="mev-detail-row">
              <span className="mev-detail-label">Coinbase Transfer:</span>
              <span className="mev-detail-value">{arb.gas_details.coinbase_transfer}</span>
            </div>
          )}
        </div>
      </div>

      {/* Swaps */}
      {arb.swaps.length > 0 && (
        <div className="mev-section-block">
          <h3 className="mev-section-title">Swaps ({arb.swaps.length})</h3>
          <div className="swaps-list">
            {arb.swaps.map((swap: SwapInfo, index: number) => (
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

export default AtomicMEVDetails;
