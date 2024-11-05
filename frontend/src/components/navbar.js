import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

function Navbar() {
    return (
        <nav className="menu">
            <ul className="navbar">
                <li>
                    <Link to="/">HOME</Link>
                </li>
                <li>
                    <Link to="/dataviz">VISUALISATIONS</Link>
                </li>
                <li>
                    <Link to="/predict">PREDICT</Link>
                </li>
            </ul>
        </nav>
    );
}

export default Navbar;
