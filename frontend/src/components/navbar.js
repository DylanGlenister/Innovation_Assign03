import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';  // Import CSS file directly

function Navbar() {
    return (
      <nav className="menu">  {/* Change `class` to `className` */}
        <ul className="navbar">  {/* Change `class` to `className` */}
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/dataviz">Visualisations</Link>
          </li>
          <li>
            <Link to="/Predict">Predict</Link>  {/* Add Predict link */}
          </li>
        </ul>
      </nav>
    );
}

export default Navbar;
