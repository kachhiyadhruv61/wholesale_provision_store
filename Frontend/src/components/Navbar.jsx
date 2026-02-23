import { Link } from "react-router-dom";
import { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { CartContext } from "../context/CartContext";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, logoutUser } = useContext(UserContext);
  const { cart } = useContext(CartContext);

  const cartItemCount = cart.length;

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
        <img src="/images/logos/3.png" alt="DK TRADERS Logo" className="logo-image" />
        <div className="logo-text">
          <span className="logo-main">DK TRADERS</span>
          <span className="logo-tagline">Wholesale Hub</span>
        </div>
      </Link>

      <button className="mobile-menu-toggle" onClick={toggleMenu}>
        {isMenuOpen ? "✕" : "☰"}
      </button>

      <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        <Link to="/" onClick={() => setIsMenuOpen(false)}>
          Home
        </Link>
        <Link to="/about" onClick={() => setIsMenuOpen(false)}>
          About
        </Link>
        <Link to="/products" onClick={() => setIsMenuOpen(false)}>
          Products
        </Link>
        <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="cart-link">
          Cart
          {cartItemCount > 0 && <span className="cart-count-badge">{cartItemCount}</span>}
        </Link>
        <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
          Contact
        </Link>
        
        {user ? (
          <div className="profile-dropdown-container">
            <button className="profile-dropdown-trigger" onClick={toggleProfileDropdown}>
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
                  My Orders
                </Link>
                <button 
                  className="profile-dropdown-item logout-item" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" onClick={() => setIsMenuOpen(false)} className="nav-login-btn">
            Login
          </Link>
        )}
      </div>
    </div>
  );
}

export default Navbar;
