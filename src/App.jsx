import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Transaction from './pages/Transaction'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tx/:tx_hash" element={<Transaction />} />
    </Routes>
  )
}

export default App
