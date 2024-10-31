// src/components/navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{ padding: '10px', textAlign: 'center' }}>
      <Link to="/" style={{ margin: '0 10px' }}>Home</Link>
      <Link to="/dataviz" style={{ margin: '0 10px' }}>DataViz</Link> {/* Add DataViz link */}
      <Link to="/humidity" style={{ margin: '0 10px' }}>Humidity Chart</Link>
      <Link to="/temperature" style={{ margin: '0 10px' }}>Temperature Chart</Link>
    </nav>
  );
}

export default Navbar;
