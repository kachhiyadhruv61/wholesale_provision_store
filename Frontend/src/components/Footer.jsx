import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>DK TRADERS</h4>
          <p>Modern wholesale e-commerce platform for B2B retailers. Fast, secure, and easy ordering with multiple payment options.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/about">About</Link></li>
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
            <li><a href="mailto:support@dktrade.com">Email Support</a></li>
            <li><a href="tel:+919876543210">+91 98765 43210</a></li>
            <li><a href="#">Live Chat</a></li>
            <li><a href="#">FAQs</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-divider"></div>

      <div className="footer-bottom">
        <p className="footer-credit">© 2026 DK TRADERS. All rights reserved. | Built with React & modern web tech</p>
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