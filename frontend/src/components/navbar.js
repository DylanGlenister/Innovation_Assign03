import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

function Navbar() {
    return (
        <nav className="menu">
            <ul className="navbar">
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li>
                    <Link to="/dataviz">Visualisations</Link>
                </li>
                <li>
                    <Link to="/predict">Predict</Link> {/* Ensure the route matches the Predict page */}
                </li>
            </ul>
        </nav>
    );
}

export default Navbar;
