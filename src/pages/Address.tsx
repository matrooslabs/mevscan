import { useParams, useNavigate } from 'react-router-dom'
import { useAddress } from '../hooks/useApi'
import Navbar from '../components/Navbar'
import type { Address as AddressType } from '../../shared/types'
import './Home.css'

function Address() {
  const { address } = useParams<{ address: string }>()
  const navigate = useNavigate()
  const {
    data: addressData,
    isLoading,
    error,
  } = useAddress(address || '')

  if (isLoading) {
    return (
      <div className="home-container">
        <Navbar />
        <div className="loading-state">Loading address...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="home-container">
        <Navbar />
        <div className="error-state">
          Error loading address: {error.message}
        </div>
      </div>
    )
  }

  // Use dummy data if API doesn't return data (for development)
  const addr: AddressType = addressData || {
    address: address || '',
    balance: '0',
    ethBalance: '0',
    transactionCount: 0,
    firstSeen: 'N/A',
    lastSeen: 'N/A',
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
            <h2>Address Details</h2>
          </div>
          <div className="card-content">
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Address:</span>
                  <div style={{ marginTop: '4px', fontSize: '14px', fontFamily: 'monospace' }}>
                    {addr.address || address}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Balance:</span>
                  <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: '600' }}>
                    {addr.ethBalance || addr.balance || '0'} ETH
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Transaction Count:</span>
                  <div style={{ marginTop: '4px', fontSize: '16px' }}>
                    {addr.transactionCount?.toLocaleString() || '0'}
                  </div>
                </div>

                {addr.firstSeen && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>First Seen:</span>
                    <div style={{ marginTop: '4px', fontSize: '16px' }}>
                      {addr.firstSeen}
                    </div>
                  </div>
                )}

                {addr.lastSeen && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Last Seen:</span>
                    <div style={{ marginTop: '4px', fontSize: '16px' }}>
                      {addr.lastSeen}
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

export default Address

