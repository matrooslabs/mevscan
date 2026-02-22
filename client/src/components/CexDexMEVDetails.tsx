import { Link } from 'react-router-dom';
import { useCexDexQuote } from '../hooks/useApi';
import type { CexDexQuoteResponse, SwapInfo } from '@mevscan/shared';
import './MEVDetails.css';

interface CexDexMEVDetailsProps {
  txHash: string;
}

function CexDexMEVDetails({ txHash }: CexDexMEVDetailsProps) {
  const { data, isLoading, error } = useCexDexQuote(txHash);

  if (isLoading) {
    return <div className="mev-details-loading">Loading CexDex details...</div>;
  }

  if (error) {
    return <div className="mev-details-error">Error loading MEV details: {error.message}</div>;
  }

  if (!data) {
    return <div className="mev-details-empty">No CexDex data found</div>;
  }

  const quote: CexDexQuoteResponse = data;

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatMidPrice = (prices: number[]): string => {
    if (!prices || prices.length === 0) return 'N/A';
    return prices.map((p) => p.toFixed(6)).join(', ');
  };

  return (
    <div className="mev-details">
      <div className="mev-details-summary">
        <div className="mev-detail-row">
          <span className="mev-detail-label">Type:</span>
          <span className="mev-detail-value mev-type-badge-cexdex">CexDex Arbitrage</span>
        </div>
        <div className="mev-detail-row">
          <span className="mev-detail-label">Profit:</span>
          <span className="mev-detail-value mev-profit">
            ${quote.profit_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mev-detail-row">
          <span className="mev-detail-label">PnL:</span>
          <span className="mev-detail-value">
            {quote.pnl.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
          </span>
        </div>
        <div className="mev-detail-row">
          <span className="mev-detail-label">Exchange:</span>
          <span className="mev-detail-value">{quote.exchange}</span>
        </div>
        <div className="mev-detail-row">
          <span className="mev-detail-label">Block:</span>
          <span className="mev-detail-value">
            <Link to={`/blocks/${quote.block_number}`}>{quote.block_number.toLocaleString()}</Link>
          </span>
        </div>
        {quote.protocols.length > 0 && (
          <div className="mev-detail-row">
            <span className="mev-detail-label">Protocols:</span>
            <span className="mev-detail-value">
              {quote.protocols.map((proto: string, i: number) => (
                <span key={i} className="protocol-badge">{proto}</span>
              ))}
            </span>
          </div>
        )}
      </div>

      {/* Mid Prices */}
      <div className="mev-section-block">
        <h3 className="mev-section-title">Mid Prices</h3>
        <div className="mev-details-grid">
          <div className="mev-detail-row">
            <span className="mev-detail-label">Instant:</span>
            <span className="mev-detail-value monospace">{formatMidPrice(quote.instant_mid_price)}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">T+2s:</span>
            <span className="mev-detail-value monospace">{formatMidPrice(quote.t2_mid_price)}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">T+12s:</span>
            <span className="mev-detail-value monospace">{formatMidPrice(quote.t12_mid_price)}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">T+30s:</span>
            <span className="mev-detail-value monospace">{formatMidPrice(quote.t30_mid_price)}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">T+60s:</span>
            <span className="mev-detail-value monospace">{formatMidPrice(quote.t60_mid_price)}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">T+300s:</span>
            <span className="mev-detail-value monospace">{formatMidPrice(quote.t300_mid_price)}</span>
          </div>
        </div>
      </div>

      {/* Gas Details */}
      <div className="mev-section-block">
        <h3 className="mev-section-title">Gas Details</h3>
        <div className="mev-details-grid">
          <div className="mev-detail-row">
            <span className="mev-detail-label">Gas Used:</span>
            <span className="mev-detail-value">{parseInt(quote.gas_details.gas_used).toLocaleString()}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">Effective Gas Price:</span>
            <span className="mev-detail-value">{quote.gas_details.effective_gas_price}</span>
          </div>
          <div className="mev-detail-row">
            <span className="mev-detail-label">Priority Fee:</span>
            <span className="mev-detail-value">{quote.gas_details.priority_fee}</span>
          </div>
          {quote.gas_details.coinbase_transfer && (
            <div className="mev-detail-row">
              <span className="mev-detail-label">Coinbase Transfer:</span>
              <span className="mev-detail-value">{quote.gas_details.coinbase_transfer}</span>
            </div>
          )}
        </div>
      </div>

      {/* Swaps */}
      {quote.swaps.length > 0 && (
        <div className="mev-section-block">
          <h3 className="mev-section-title">Swaps ({quote.swaps.length})</h3>
          <div className="swaps-list">
            {quote.swaps.map((swap: SwapInfo, index: number) => (
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

export default CexDexMEVDetails;
