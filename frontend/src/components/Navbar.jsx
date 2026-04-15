import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import './Navbar.css';
import './AuthModal.css';

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
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  const getInitial = () => {
    if (user?.display_name) return user.display_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <>
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

            {/* Auth Section */}
            {!loading && (
              user ? (
                <div className="user-menu" ref={dropdownRef}>
                  <button
                    className="user-avatar-btn"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="user-avatar-img" />
                    ) : (
                      <span className="user-avatar-placeholder">{getInitial()}</span>
                    )}
                    <span>{user.display_name || user.email?.split('@')[0]}</span>
                  </button>

                  {showDropdown && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-info">
                        <div className="user-name">{user.display_name || 'User'}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                      <button className="user-dropdown-btn" onClick={handleLogout}>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button className="nav-signin-btn" onClick={() => { setShowAuth(true); setMenuOpen(false); }}>
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
