import { useParams, useNavigate } from 'react-router-dom'
import { useBlock } from '../hooks/useApi'
import Navbar from '../components/Navbar'
import './Home.css'

function Block() {
  const { block_number } = useParams()
  const navigate = useNavigate()
  const {
    data: blockData,
    isLoading,
    error,
  } = useBlock(block_number)

  if (isLoading) {
    return (
      <div className="home-container">
        <Navbar />
        <div className="loading-state">Loading block...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="home-container">
        <Navbar />
        <div className="error-state">
          Error loading block: {error.message}
        </div>
      </div>
    )
  }

  // Use dummy data if API doesn't return data (for development)
  const block = blockData || {
    number: block_number,
    timestamp: 'N/A',
    miner: 'Unknown',
    minerAddress: '0x0000...0000',
    expressLaneTxns: 0,
    totalTxns: 0,
    timeTaken: 'N/A',
    ethValue: '0',
    hash: '0x0000...0000',
    parentHash: '0x0000...0000',
    gasUsed: '0',
    gasLimit: '0',
    baseFeePerGas: '0',
  }

  return (
    <div className="home-container">
      <Navbar />

      <div className="search-section">
        <div className="search-container">
          <button
            onClick={() => navigate('/')}
            className="search-button"
            style={{ marginRight: '10px' }}
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="content-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card latest-blocks">
          <div className="card-header">
            <h2>Block #{block.number?.toLocaleString() || block_number}</h2>
          </div>
          <div className="card-content">
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Block Number:</span>
                  <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: '500' }}>
                    {block.number?.toLocaleString() || block_number}
                  </div>
                </div>
                
                {block.hash && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Block Hash:</span>
                    <div style={{ marginTop: '4px', fontSize: '14px', fontFamily: 'monospace' }}>
                      {block.hash}
                    </div>
                  </div>
                )}

                {block.parentHash && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Parent Hash:</span>
                    <div style={{ marginTop: '4px', fontSize: '14px', fontFamily: 'monospace' }}>
                      {block.parentHash}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Timestamp:</span>
                  <div style={{ marginTop: '4px', fontSize: '16px' }}>
                    {block.timestamp}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Miner:</span>
                  <div style={{ marginTop: '4px', fontSize: '16px' }}>
                    {block.miner || 'Unknown'}
                  </div>
                  {block.minerAddress && (
                    <a
                      href={`/address/${block.minerAddress.replace('...', '')}`}
                      onClick={(e) => {
                        e.preventDefault();
                        // Extract full address if we have it, or use the truncated one
                        const address = block.fullMinerAddress || block.minerAddress.replace('...', '');
                        navigate(`/address/${address}`);
                      }}
                      style={{ 
                        marginTop: '4px', 
                        fontSize: '14px', 
                        fontFamily: 'monospace', 
                        color: '#3b82f6',
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {block.minerAddress}
                    </a>
                  )}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Transactions:</span>
                  <div style={{ marginTop: '4px', fontSize: '16px' }}>
                    {block.expressLaneTxns !== undefined && (
                      <span style={{ marginRight: '16px' }}>
                        {block.expressLaneTxns} Express Lane txns
                      </span>
                    )}
                    <span>{block.totalTxns || 0} txns</span>
                  </div>
                </div>

                {block.timeTaken && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Time Taken:</span>
                    <div style={{ marginTop: '4px', fontSize: '16px' }}>
                      {block.timeTaken}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Eth Value:</span>
                  <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: '600' }}>
                    {block.ethValue || '0'} ETH
                  </div>
                </div>

                {block.gasUsed && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Gas Used:</span>
                    <div style={{ marginTop: '4px', fontSize: '16px' }}>
                      {block.gasUsed}
                    </div>
                  </div>
                )}

                {block.gasLimit && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Gas Limit:</span>
                    <div style={{ marginTop: '4px', fontSize: '16px' }}>
                      {block.gasLimit}
                    </div>
                  </div>
                )}

                {block.baseFeePerGas && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Base Fee Per Gas:</span>
                    <div style={{ marginTop: '4px', fontSize: '16px' }}>
                      {block.baseFeePerGas} Gwei
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Block

