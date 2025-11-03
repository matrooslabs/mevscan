import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

function Home() {
  const [txHash, setTxHash] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (txHash.trim()) {
      navigate(`/tx/${txHash.trim()}`)
    }
  }

  // Mock data - replace with actual API calls
  const latestBlocks = [
    { 
      number: 23717104, 
      timestamp: '5 secs ago', 
      miner: 'Titan Builder', 
      minerAddress: '0x4838b106...B0BAD5f97',
      expressLaneTxns: 45,
      totalTxns: 220, 
      timeTaken: '12 secs',
      ethValue: '0.03488'
    },
    { 
      number: 23717103, 
      timestamp: '17 secs ago', 
      miner: 'BuilderNet', 
      minerAddress: '0xdadb0d80...24f783711',
      expressLaneTxns: 52,
      totalTxns: 234, 
      timeTaken: '12 secs',
      ethValue: '0.02176'
    },
    { 
      number: 23717102, 
      timestamp: '29 secs ago', 
      miner: 'Titan Builder', 
      minerAddress: '0x4838b106...B0BAD5f97',
      expressLaneTxns: 68,
      totalTxns: 282, 
      timeTaken: '12 secs',
      ethValue: '0.07486'
    },
    { 
      number: 23717101, 
      timestamp: '41 secs ago', 
      miner: null, 
      minerAddress: '0x1f9090aa...8e676c326',
      expressLaneTxns: 23,
      totalTxns: 110, 
      timeTaken: '12 secs',
      ethValue: '0.00724'
    },
    { 
      number: 23717100, 
      timestamp: '53 secs ago', 
      miner: 'BuilderNet', 
      minerAddress: '0xdadb0d80...24f783711',
      expressLaneTxns: 89,
      totalTxns: 382, 
      timeTaken: '12 secs',
      ethValue: '0.02058'
    },
    { 
      number: 23717099, 
      timestamp: '1 min ago', 
      miner: 'Titan Builder', 
      minerAddress: '0x4838b106...B0BAD5f97',
      expressLaneTxns: 38,
      totalTxns: 202, 
      timeTaken: '12 secs',
      ethValue: '0.01849'
    },
  ]

  const latestTransactions = [
    { 
      hash: '0xb791a07c9aefa03db87f8ad128121ed5b8a7096d8c968df682686ac7ea61e594', 
      from: '0xdadB0d80...24f783711', 
      to: '0x4675C7e5...ef3b0a263', 
      toLabel: null,
      value: '0.20476', 
      time: '20 secs ago' 
    },
    { 
      hash: '0x51640f94fc391cfc47e120e1f877c95ad87a74f639dd23497e591679979d50c9', 
      from: '0xdadB0d80...24f783711', 
      to: '0xB423b53D...adC211020', 
      toLabel: null,
      value: '0.00158', 
      time: '20 secs ago' 
    },
    { 
      hash: '0x3481191f2f58b1e8bd28925ea21e39a9831e2131e9ffba9c62df25f95ca42d0c', 
      from: '0x0Dc1E92F...3b1A03d73', 
      to: '0x3Fb9cED5...39519f65A', 
      toLabel: null,
      value: '0.22', 
      time: '20 secs ago' 
    },
    { 
      hash: '0x1053e70bd8f205624b27e157d34c569eb317d5d4365f27ec79a4956426f68cab', 
      from: '0x2A66c35C...54c1471FD', 
      to: '0xf984A448...396272A65', 
      toLabel: null,
      value: '0.0022', 
      time: '20 secs ago' 
    },
    { 
      hash: '0xd883c28e36e95cc0dcc1ac63b432f83f9aa4ad07718b619cb58f97b69ad301a7', 
      from: '0xd1Db5ecb...51F29E707', 
      to: '0x307576Dd...E8e067d31', 
      toLabel: null,
      value: '0.00578', 
      time: '20 secs ago' 
    },
    { 
      hash: '0x6e09878217cbf8cb54746e41021e1aba6cdf144f4205bbfdd836891825905ceb', 
      from: '0x66E092fD...d738aE7bC', 
      to: '0xC333E80e...2D294F771', 
      toLabel: null,
      value: '960', 
      time: '20 secs ago' 
    },
  ]

  const etherPrice = 2450.75
  const mevExtracted = 1234.56

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1 className="logo">MEVGPT</h1>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search by Transaction Hash / Block Number / Address / Token"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              🔍
            </button>
          </form>
        </div>
      </header>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Ether Price</span>
          <span className="stat-value">${etherPrice.toLocaleString()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MEV Extracted</span>
          <span className="stat-value">{mevExtracted.toLocaleString()} ETH</span>
        </div>
      </div>

      <div className="content-grid">
        <div className="card latest-blocks">
          <div className="card-header">
            <h2>Latest Blocks</h2>
            <a href="#" className="view-all-link">View all →</a>
          </div>
          <div className="card-content">
            <div className="blocks-list">
              {latestBlocks.map((block, index) => (
                <div key={index}>
                  <div className="block-item">
                    <div className="block-main">
                      <span className="block-icon">▣</span>
                      <div className="block-info">
                        <div className="block-number-time">
                          <a 
                            href={`#block/${block.number}`} 
                            className="link-primary block-number"
                            onClick={(e) => {
                              e.preventDefault()
                              // Navigate to block detail page if needed
                            }}
                          >
                            {block.number.toLocaleString()}
                          </a>
                          <span className="block-time">{block.timestamp}</span>
                        </div>
                        <div className="block-details">
                          <div className="block-txns-group">
                            <a 
                              href={`#txs?block=${block.number}`} 
                              className="link-primary block-txns"
                            >
                              {block.expressLaneTxns} Express Lane txns
                            </a>
                            <a 
                              href={`#txs?block=${block.number}`} 
                              className="link-primary block-txns"
                            >
                              {block.totalTxns} txns
                            </a>
                          </div>
                          <span className="block-time-taken">in {block.timeTaken}</span>
                        </div>
                      </div>
                    </div>
                    <div className="block-value">{block.ethValue} Eth</div>
                  </div>
                  {index < latestBlocks.length - 1 && <hr className="block-separator" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card latest-transactions">
          <div className="card-header">
            <h2>Latest Transactions</h2>
            <a href="#" className="view-all-link">View all →</a>
          </div>
          <div className="card-content">
            <div className="transactions-list">
              {latestTransactions.map((tx, index) => (
                <div key={index}>
                  <div className="transaction-item">
                    <div className="transaction-main">
                      <span className="tx-icon">⇄</span>
                      <div className="tx-info">
                        <div className="tx-hash-time">
                          <a 
                            href={`/tx/${tx.hash}`} 
                            className="link-primary tx-hash"
                            onClick={(e) => {
                              e.preventDefault()
                              navigate(`/tx/${tx.hash}`)
                            }}
                          >
                            {tx.hash.substring(0, 12)}...
                          </a>
                          <span className="tx-time">{tx.time}</span>
                        </div>
                        <div className="tx-addresses">
                          <div className="tx-address-group">
                            <span className="tx-label">From</span>
                            <a href={`#address/${tx.from}`} className="link-secondary tx-address">
                              {tx.from}
                            </a>
                          </div>
                          <div className="tx-address-group">
                            <span className="tx-label">To</span>
                            <a href={`#address/${tx.to}`} className="link-secondary tx-address">
                              {tx.toLabel && <span className="address-label">{tx.toLabel} </span>}
                              {tx.to}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="tx-value">{tx.value} Eth</div>
                  </div>
                  {index < latestTransactions.length - 1 && <hr className="transaction-separator" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

