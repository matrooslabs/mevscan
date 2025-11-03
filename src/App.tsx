import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Transaction from './pages/Transaction'
import Block from './pages/Block'
import Address from './pages/Address'
import './App.css'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ask" element={<div>Ask Page - Coming Soon</div>} />
        <Route path="/tx/:tx_hash" element={<Transaction />} />
        <Route path="/blocks/:block_number" element={<Block />} />
        <Route path="/address/:address" element={<Address />} />
      </Routes>
    </>
  )
}

export default App

