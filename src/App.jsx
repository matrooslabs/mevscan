import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Transaction from './pages/Transaction'
import Block from './pages/Block'
import Address from './pages/Address'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tx/:tx_hash" element={<Transaction />} />
      <Route path="/blocks/:block_number" element={<Block />} />
      <Route path="/address/:address" element={<Address />} />
    </Routes>
  )
}

export default App
