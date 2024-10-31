import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{ padding: '10px', textAlign: 'center' }}>
      <Link to="/" style={{ margin: '0 10px' }}>Home</Link>
      <Link to="/dataviz" style={{ margin: '0 10px' }}>DataViz</Link>
    </nav>
  );
}

export default Navbar;
