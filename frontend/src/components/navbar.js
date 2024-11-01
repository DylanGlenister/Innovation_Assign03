import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';  // Import CSS file directly

function Navbar() {
    return (
      <nav class="menu">
        <ul class="navbar">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/dataviz">Visualisations</Link>
          </li>
        </ul>
      </nav>
    );
  }

export default Navbar;
