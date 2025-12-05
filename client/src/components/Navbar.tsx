import { useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()

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
      </div>
    </nav>
  )
}

export default Navbar

