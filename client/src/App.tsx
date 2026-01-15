import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;
