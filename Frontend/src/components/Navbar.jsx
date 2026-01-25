import { Link } from "react-router-dom";
import { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, logoutUser } = useContext(UserContext);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = () => {
    logoutUser();
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  return (
    <div className="navbar">
      <Link to="/" className="logo-container">
        <div className="logo-icon">🛒</div>
        <div className="logo-text">
          <span className="logo-main">A1 Store</span>
          <span className="logo-tagline">Wholesale Hub</span>
        </div>
      </Link>

      <button className="mobile-menu-toggle" onClick={toggleMenu}>
        {isMenuOpen ? "✕" : "☰"}
      </button>

      <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        <Link to="/" onClick={() => setIsMenuOpen(false)}>
          <span className="nav-icon">🏠</span>
          Home
        </Link>
        <Link to="/about" onClick={() => setIsMenuOpen(false)}>
          <span className="nav-icon">ℹ️</span>
          About
        </Link>
        <Link to="/products" onClick={() => setIsMenuOpen(false)}>
          <span className="nav-icon">🛍️</span>
          Products
        </Link>
        <Link to="/cart" onClick={() => setIsMenuOpen(false)}>
          <span className="nav-icon">🛒</span>
          Cart
        </Link>
        <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
          <span className="nav-icon">📞</span>
          Contact
        </Link>
        
        {user ? (
          <div className="profile-dropdown-container">
            <button className="profile-dropdown-trigger" onClick={toggleProfileDropdown}>
              <span className="nav-icon">👤</span>
              <span className="user-name">{user.username}</span>
              <span className="dropdown-arrow">{isProfileDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {isProfileDropdownOpen && (
              <div className="profile-dropdown-menu">
                <Link 
                  to="/profile" 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="profile-dropdown-item"
                >
                  <span className="nav-icon">👤</span>
                  My Account
                </Link>
                <Link 
                  to="/order-history" 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsProfileDropdownOpen(false);
                  }}
                  className="profile-dropdown-item"
                >
                  <span className="nav-icon">📦</span>
                  My Orders
                </Link>
                <button 
                  className="profile-dropdown-item logout-item" 
                  onClick={handleLogout}
                >
                  <span className="nav-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" onClick={() => setIsMenuOpen(false)} className="nav-login-btn">
            <span className="nav-icon">🔐</span>
            Login
          </Link>
        )}
      </div>
    </div>
  );
}

export default Navbar;
