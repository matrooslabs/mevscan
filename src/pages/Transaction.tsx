import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './Home.css'

function Transaction() {
  const { tx_hash } = useParams<{ tx_hash: string }>()
  const navigate = useNavigate()

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
            <h2>Transaction Details</h2>
          </div>
          <div className="card-content">
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Transaction Hash:</span>
                <div style={{ marginTop: '4px', fontSize: '14px', fontFamily: 'monospace' }}>
                  {tx_hash}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Transaction

