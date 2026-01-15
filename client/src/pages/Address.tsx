import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAddress } from '../hooks/useApi';
import type { Address as AddressType } from '@mevscan/shared';
import './Address.css';

function Address() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { data: addressData, isLoading, error } = useAddress(address || '', page, pageSize);

  if (isLoading) {
    return (
      <div className="address-page-container">
        <div className="loading-state">Loading address...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="address-page-container">
        <div className="error-state">Error loading address: {error.message}</div>
      </div>
    );
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
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    if (!hash || hash.length < 12) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const copyToClipboard = async (text: string, hashType: 'address' | 'txHash') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(hashType);
      setTimeout(() => {
        setCopiedHash(null);
      }, 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedHash(hashType);
        setTimeout(() => {
          setCopiedHash(null);
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="address-page-container">
      {/* Header */}
      <div className="address-header">
        <div className="address-header-content">
          <button onClick={() => navigate('/')} className="back-button">
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
                      <path
                        d="M11.6667 3.5L5.25 9.91667L2.33334 7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M9.5 1H2.5C1.67157 1 1 1.67157 1 2.5V9.5C1 10.3284 1.67157 11 2.5 11H4.5V12.5C4.5 13.3284 5.17157 14 6 14H11.5C12.3284 14 13 13.3284 13 12.5V5.5C13 4.67157 12.3284 4 11.5 4H9.5V1Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path d="M9.5 1V4H13" stroke="currentColor" strokeWidth="1.5" fill="none" />
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

        {/* Statistics Section */}
        {addr.statistics && (
          <div className="address-section">
            <div className="section-header">
              <h2>{addr.isContract ? 'Contract' : 'EOA'} Statistics</h2>
            </div>
            <div className="section-content">
              <div className="overview-grid">
                <div className="overview-item">
                  <span className="overview-label">Total Profit (USD):</span>
                  <span className="overview-value">
                    $
                    {addr.statistics.totalProfitUsd.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Total Bribe (USD):</span>
                  <span className="overview-value">
                    $
                    {addr.statistics.totalBribeUsd.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Total Transactions:</span>
                  <span className="overview-value">
                    {addr.statistics.totalTransactions.toLocaleString()}
                  </span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Timeboosted Transactions:</span>
                  <span className="overview-value">
                    {addr.statistics.timeboostedCount.toLocaleString()}
                    {addr.statistics.totalTransactions > 0 && (
                      <span className="percentage-badge">
                        (
                        {(
                          (addr.statistics.timeboostedCount / addr.statistics.totalTransactions) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* MEV Type Breakdown */}
              {Object.keys(addr.statistics.mevTypeBreakdown).length > 0 && (
                <div className="mev-type-breakdown">
                  <h3 className="breakdown-title">MEV Type Breakdown</h3>
                  <div className="breakdown-grid">
                    {Object.entries(addr.statistics.mevTypeBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([mevType, count]) => (
                        <div key={mevType} className="breakdown-item">
                          <span className="breakdown-label">{mevType}:</span>
                          <span className="breakdown-value">
                            {count.toLocaleString()}
                            {addr.statistics?.totalTransactions &&
                              addr.statistics.totalTransactions > 0 && (
                                <span className="percentage-badge">
                                  ({((count / addr.statistics.totalTransactions) * 100).toFixed(1)}
                                  %)
                                </span>
                              )}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MEV Transactions List Section */}
        {addr.mevTransactions && addr.mevTransactions.transactions.length > 0 && (
          <div className="address-section">
            <div className="section-header">
              <h2>MEV Transactions List</h2>
              {addr.mevTransactions.pagination && (
                <div className="pagination-info">
                  Showing{' '}
                  {(addr.mevTransactions.pagination.page - 1) *
                    addr.mevTransactions.pagination.pageSize +
                    1}{' '}
                  -{' '}
                  {Math.min(
                    addr.mevTransactions.pagination.page * addr.mevTransactions.pagination.pageSize,
                    addr.mevTransactions.pagination.total
                  )}{' '}
                  of {addr.mevTransactions.pagination.total.toLocaleString()}
                </div>
              )}
            </div>
            <div className="section-content">
              <div className="transactions-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transaction Hash</th>
                      <th>Block</th>
                      <th>MEV Type</th>
                      <th>Profit (USD)</th>
                      <th>Bribe (USD)</th>
                      {addr.isContract ? <th>EOA</th> : <th>MEV Contract</th>}
                      <th>Timeboosted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addr.mevTransactions.transactions.map((tx, index) => (
                      <tr key={`${tx.txHash}-${index}`}>
                        <td className="monospace">
                          <Link to={`/transaction/${tx.txHash}`} className="hash-link">
                            {formatHash(tx.txHash)}
                          </Link>
                        </td>
                        <td>
                          <Link to={`/block/${tx.blockNumber}`} className="block-link">
                            {tx.blockNumber.toLocaleString()}
                          </Link>
                        </td>
                        <td>
                          <span className="mev-type-badge">{tx.mevType}</span>
                        </td>
                        <td>
                          $
                          {tx.profitUsd.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          $
                          {tx.bribeUsd.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        {addr.isContract ? (
                          <td className="monospace">
                            {tx.eoa ? (
                              <Link to={`/address/${tx.eoa}`} className="address-link">
                                {formatAddress(tx.eoa)}
                              </Link>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                        ) : (
                          <td className="monospace">
                            {tx.mevContract ? (
                              <Link to={`/address/${tx.mevContract}`} className="address-link">
                                {formatAddress(tx.mevContract)}
                              </Link>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                        )}
                        <td>
                          {tx.timeboosted ? (
                            <span className="timeboosted-badge">Yes</span>
                          ) : (
                            <span className="timeboosted-no">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {addr.mevTransactions.pagination &&
                addr.mevTransactions.pagination.totalPages > 1 && (
                  <div className="pagination-controls">
                    <div className="pagination-left">
                      <label htmlFor="page-size-select">Items per page:</label>
                      <select
                        id="page-size-select"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1); // Reset to first page when changing page size
                        }}
                        className="page-size-select"
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                    <div className="pagination-right">
                      <button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="pagination-button"
                      >
                        First
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="pagination-button"
                      >
                        Previous
                      </button>
                      <span className="pagination-page-info">
                        Page {page} of {addr.mevTransactions.pagination.totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) =>
                            Math.min(addr.mevTransactions?.pagination?.totalPages ?? 1, p + 1)
                          )
                        }
                        disabled={page >= (addr.mevTransactions?.pagination?.totalPages ?? 1)}
                        className="pagination-button"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setPage(addr.mevTransactions?.pagination?.totalPages ?? 1)}
                        disabled={page >= (addr.mevTransactions?.pagination?.totalPages ?? 1)}
                        className="pagination-button"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {addr.statistics && addr.statistics.totalTransactions === 0 && (
          <div className="address-section">
            <div className="section-header">
              <h2>MEV Transactions List</h2>
            </div>
            <div className="section-content">
              <div className="empty-state">No MEV transactions found for this address.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Address;
