import { useState, useMemo, FormEvent, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLatestBlocks, useLatestTransactions, useTimeboostGrossRevenue } from "../hooks/useApi";
import type { BlockListItem, Transaction } from "@mevscan/shared";
import "./Home.css";

interface TransactionHistoryData {
  date: string;
  count: number;
  fullDate: Date;
}

function Home() {
  const [txHash, setTxHash] = useState<string>("");
  const navigate = useNavigate();

  // Fetch data using TanStack Query
  const {
    data: latestBlocksData,
    isLoading: blocksLoading,
    error: blocksError,
  } = useLatestBlocks(30);
  const {
    data: latestTransactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useLatestTransactions(10);
  const {
    data: timeboostGrossRevenueData,
    isLoading: timeboostGrossRevenueLoading,
    error: timeboostGrossRevenueError,
  } = useTimeboostGrossRevenue();

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const searchTerm = txHash.trim();
    if (searchTerm) {
      // Check if it's a block number (numeric)
      if (/^\d+$/.test(searchTerm)) {
        navigate(`/blocks/${searchTerm}`);
      } 
      // Check if it's an address (starts with 0x and is 42 chars)
      else if (/^0x[a-fA-F0-9]{40}$/.test(searchTerm)) {
        navigate(`/address/${searchTerm}`);
      }
      // Otherwise assume it's a transaction hash
      else {
        navigate(`/transaction/${searchTerm}`);
      }
    }
  };

  // Use data from TanStack Query or fallback to empty array
  const latestBlocks: BlockListItem[] = latestBlocksData || [];
  const latestTransactions: Transaction[] = latestTransactionsData || [];

  // Get ETH price from the latest block (first block in the list)
  const etherPrice = latestBlocks.length > 0 && latestBlocks[0].ethPrice 
    ? latestBlocks[0].ethPrice 
    : null;
  // Get Timeboost Auction Revenue (total_first_price) - gross revenue (all-time)
  const timeboostAuctionRevenue = timeboostGrossRevenueData?.total_second_price ?? null;

  // Generate transaction history data for last 14 days
  const transactionHistory = useMemo<TransactionHistoryData[]>(() => {
    const data: TransactionHistoryData[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Random transaction count between 120k and 180k (similar to Etherscan)
      const count = Math.floor(Math.random() * (180000 - 120000 + 1)) + 120000;
      data.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count,
        fullDate: date,
      });
    }
    return data;
  }, []);

  return (
    <div className="home-container">
      <div className="search-section">
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search by Transaction Hash / Block Number / Address / Token"
              value={txHash}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTxHash(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              🔍
            </button>
          </form>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">ETH Price</span>
          <span className="stat-value">
            {etherPrice !== null 
              ? `$${etherPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : blocksLoading 
                ? 'Loading...' 
                : 'N/A'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Timeboost Auction Revenue</span>
          <span className="stat-value">
            {timeboostAuctionRevenue !== null 
              ? `${timeboostAuctionRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETH`
              : timeboostGrossRevenueLoading 
                ? 'Loading...' 
                : timeboostGrossRevenueError
                  ? 'Error'
                  : 'N/A'}
          </span>
        </div>
        <div className="stat-item chart-item">
          <span className="stat-label">Transaction History in 14 Days</span>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart
                data={transactionHistory}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="colorTransactions"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FFA726" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FFA726" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide={true} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                  labelStyle={{
                    color: "#374151",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                  formatter={(value: number) => value.toLocaleString()}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#FFA726"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorTransactions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="card latest-blocks">
          <div className="card-header">
            <h2>Latest Blocks</h2>
            <a href="#" className="view-all-link">
              View all →
            </a>
          </div>
          <div className="card-content">
            {blocksLoading && (
              <div className="loading-state">
                <div className="spinner"></div>
              </div>
            )}
            {blocksError && (
              <div className="error-state">
                Error loading blocks: {blocksError.message}
              </div>
            )}
            {!blocksLoading && !blocksError && (
              <div className="blocks-list">
                {latestBlocks.length === 0 ? (
                  <div className="empty-state">No blocks available</div>
                ) : (
                  latestBlocks.map((block, index) => (
                    <div key={index}>
                      <div className="block-item">
                        <div className="block-main">
                          <span className="block-icon">▣</span>
                          <div className="block-info">
                            <div className="block-number-time">
                              <a
                                href={`/blocks/${block.number}`}
                                className="link-primary block-number"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/blocks/${block.number}`);
                                }}
                              >
                                {block.number.toLocaleString()}
                              </a>
                              <span className="block-time">
                                Hash: {block.hash.substring(0, 10)}...
                              </span>
                            </div>
                            <div className="block-details">
                              <div className="block-txns-group">
                                <a
                                  href={`#txs?block=${block.number}`}
                                  className="link-primary block-txns"
                                >
                                  {block.mevCount} MEV txns
                                </a>
                                <a
                                  href={`#txs?block=${block.number}`}
                                  className="link-primary block-txns"
                                >
                                  {block.timeboostedTxMevCount} Timeboosted MEV
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="block-value">${block.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      {index < latestBlocks.length - 1 && (
                        <hr className="block-separator" />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card latest-transactions">
          <div className="card-header">
            <h2>Latest Transactions</h2>
            <a href="#" className="view-all-link">
              View all →
            </a>
          </div>
          <div className="card-content">
            {transactionsLoading && (
              <div className="loading-state">
                <div className="spinner"></div>
              </div>
            )}
            {transactionsError && (
              <div className="error-state">
                Error loading transactions: {transactionsError.message}
              </div>
            )}
            {!transactionsLoading && !transactionsError && (
              <div className="transactions-list">
                {latestTransactions.length === 0 ? (
                  <div className="empty-state">No transactions available</div>
                ) : (
                  latestTransactions.map((tx, index) => (
                    <div key={index}>
                      <div className="transaction-item">
                        <div className="transaction-main">
                          <span className="tx-icon">⇄</span>
                          <div className="tx-info">
                            <div className="tx-hash-time">
                              <Link
                                to={`/transaction/${tx.hash}`}
                                className="link-primary tx-hash"
                              >
                                {tx.hash.substring(0, 16)}...
                              </Link>
                              <span className="tx-time">Block {tx.blockNumber.toLocaleString()}</span>
                            </div>
                            <div className="tx-addresses">
                              <div className="tx-address-group">
                                <span className="tx-label">MEV Type</span>
                                <span className="tx-address">
                                  {tx.mevType}
                                </span>
                              </div>
                              <div className="tx-address-group">
                                <span className="tx-label">Profit</span>
                                <span className="tx-address">
                                  ${tx.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                </span>
                              </div>
                              <div className="tx-address-group">
                                <span className="tx-label">Timeboosted</span>
                                <span className="tx-address">
                                  {tx.timeboosted ? '✓ Yes' : '✗ No'}
                                </span>
                              </div>
                              {tx.expressLaneController && (
                                <div className="tx-address-group">
                                  <span className="tx-label">Express Lane Controller</span>
                                  <Link
                                    to={`/address/${tx.expressLaneController}`}
                                    className="link-secondary tx-address"
                                  >
                                    {tx.expressLaneController.substring(0, 10)}...{tx.expressLaneController.slice(-8)}
                                  </Link>
                                </div>
                              )}
                              {tx.expressLanePrice && (
                                <div className="tx-address-group">
                                  <span className="tx-label">Express Lane Price</span>
                                  <span className="tx-address">
                                    {tx.expressLanePrice}
                                  </span>
                                </div>
                              )}
                              {tx.expressLaneRound !== null && tx.expressLaneRound !== undefined && (
                                <div className="tx-address-group">
                                  <span className="tx-label">Express Lane Round</span>
                                  <span className="tx-address">
                                    {tx.expressLaneRound.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="tx-value">${tx.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      {index < latestTransactions.length - 1 && (
                        <hr className="transaction-separator" />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

