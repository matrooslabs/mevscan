import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Transaction from './pages/Transaction';
import Block from './pages/Block';
import Address from './pages/Address';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/explorer" element={<Home />} />
        <Route path="/transaction/:tx_hash" element={<Transaction />} />
        <Route path="/blocks/:block_number" element={<Block />} />
        <Route path="/address/:address" element={<Address />} />
      </Routes>
    </>
  );
}

export default App;
