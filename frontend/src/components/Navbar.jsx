import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import './Navbar.css';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/vineyards', label: 'Vineyards' },
  { path: '/insights', label: 'Insights' },
  { path: '/planner', label: 'Trip Planner' },
  { path: '/hotels-dining', label: 'Hotels & Dining' },
  { path: '/attractions', label: 'Attractions' },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">&#127863;</span>
          <span className="brand-text">VinoVoyage</span>
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '\u2715' : '\u2630'}
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
