import { Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

function Footer() {
  const { user } = useContext(UserContext);

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>DK TRADERS</h4>
          <p>Modern wholesale e-commerce platform for B2B retailers. Fast, secure, and easy ordering with multiple payment options.</p>
          <div className="social-media">
            <a href="https://www.facebook.com/profile.php?id=61587681500936" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://www.twitter.com/dktrade" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://www.instagram.com/dktraders1027/" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            {!user && <li><Link to="/about">About</Link></li>}
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Features</h4>
          <ul className="footer-links">
            <li><a href="#moq">MOQ Validation</a></li>
            <li><a href="#bulk">Bulk Pricing</a></li>
            <li><a href="#checkout">3-Step Checkout</a></li>
            <li><a href="#payments">4 Payment Methods</a></li>
            <li><a href="#orders">Order History</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <ul className="footer-links">
            <li><a href="mailto:dktraders1027@gmail.com">Email Support</a></li>
            <li><a href="tel:+919313616159">+91 9313616159</a></li>
            <li><a href="/FAQs">FAQs</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-divider"></div>

      <div className="footer-bottom">
        <p className="footer-credit">© 2026 DK TRADERS. All rights reserved. | GSTIN: 24ZPHBLBAQVW1Z | Built with React & modern web tech</p>
        <div className="footer-badges">
          <span className="badge">React 19</span>
          <span className="badge">Context API</span>
          <span className="badge">Responsive</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;