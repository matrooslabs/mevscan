import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Transaction from './pages/Transaction'
import Block from './pages/Block'
import Address from './pages/Address'
import Chart from './pages/Chart'
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ask" element={<div>Ask Page - Coming Soon</div>} />
        <Route path="/transaction/:tx_hash" element={<Transaction />} />
        <Route path="/blocks/:block_number" element={<Block />} />
        <Route path="/address/:address" element={<Address />} />
        <Route path="/chart" element={<Chart />} />
      </Routes>
    </>
  )
}

export default App

