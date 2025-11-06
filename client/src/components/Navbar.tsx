import { useNavigate } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { formattedAddress, isConnected, isConnecting, connect, disconnect } =
    useWallet()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 
          className="navbar-logo" 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer' }}
        >
          MevScan
        </h1>
        <div className="navbar-menu">
          <h2 
            className="navbar-menu-item"
            onClick={() => navigate('/')}
          >
            Home
          </h2>
          <h2 
            className="navbar-menu-item"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </h2>
          <h2 
            className="navbar-menu-item"
            onClick={() => navigate('/ask')}
          >
            Ask
          </h2>
        </div>
        <div className="navbar-right">
          <div className="wallet-button-container">
            {isConnected ? (
              <div className="wallet-connected">
                <span className="wallet-address">{formattedAddress}</span>
                <button
                  onClick={disconnect}
                  className="wallet-disconnect-button"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="connect-wallet-button"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

