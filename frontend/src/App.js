import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/navbar';
import Home from './pages/Home';
import DataViz from './pages/DataViz';
import HumidityLineChart from './components/HumidityLineChart';
import TempScatterChart from './components/TempScatterChart';


function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dataviz" element={<DataViz />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
