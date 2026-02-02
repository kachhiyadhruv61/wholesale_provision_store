import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext";

function Home() {
  const navigate = useNavigate();
  const { products } = useContext(ProductContext);
  const { addToCart } = useContext(CartContext);
  
  // Get first 6 products for home page
  const featuredProducts = products.slice(0, 6);

  const handleAddToCart = (product) => {
    addToCart(product);
  };
  return (
    <main className="home">
      {/* Hero Section */}
      <section className="hero-modern">
        <div className="hero-pattern"></div>
        <div className="hero-overlay"></div>
        <div className="hero-content-wrapper">
          <div className="hero-text">
            <span className="hero-badge">🎉 New Season Collection</span>
            <h1 className="hero-main-title">
              Welcome to <span className="brand-highlight">DK TRADERS</span>
            </h1>
            <p className="hero-description">
              Your trusted wholesale partner for quality products at unbeatable prices.
              Fast checkout and doorstep delivery.
            </p>
            <div className="hero-cta-buttons">
              <Link className="btn btn-hero-primary" to="/products">
                🛍️ Browse Products
              </Link>
              <Link className="btn btn-hero-secondary" to="/register">
                📝 Create Account
              </Link>
            </div>
          </div>
          
          <div className="hero-stats-card">
            <div className="hero-stats-inner">
              <div className="hero-feature-item">
                <div className="hero-feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="7" width="12" height="8" rx="2" />
                    <path d="M13 9h4l3 3v3h-7" />
                    <circle cx="6" cy="17" r="2" />
                    <circle cx="18" cy="17" r="2" />
                  </svg>
                </div>
                <div className="hero-feature-text">
                  <h4>Free Shipping</h4>
                  <p>On orders over ₹5000</p>
                </div>
              </div>

              <div className="hero-feature-divider" />

              <div className="hero-feature-item">
                <div className="hero-feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h7v7H4z" />
                    <path d="M13 13h7v7h-7z" />
                    <path d="M13 4h7v7h-7z" />
                  </svg>
                </div>
                <div className="hero-feature-text">
                  <h4>Bulk Order Support</h4>
                  <p>Special pricing for bulk buyers</p>
                </div>
              </div>

              <div className="hero-feature-divider" />

              <div className="hero-feature-item">
                <div className="hero-feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="11" width="16" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    <circle cx="12" cy="15.5" r="1.5" />
                  </svg>
                </div>
                <div className="hero-feature-text">
                  <h4>Secure Payment</h4>
                  <p>100% protected payments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How DK TRADERS Works</h2>
        <p className="section-subtitle">Get started in 4 simple steps</p>
        
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">👤</div>
            <h3>Login or Register</h3>
            <p>Sign up as a retailer and get instant access to wholesale prices</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">🔍</div>
            <h3>Browse Products</h3>
            <p>Explore our wide range of quality products across multiple categories</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">🛒</div>
            <h3>Add to Cart</h3>
            <p>Select your items and add them to cart with just one click</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon">✅</div>
            <h3>Place Order</h3>
            <p>Complete checkout and get your order delivered to your doorstep</p>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products">
        <h2 className="section-title">Featured Products</h2>
        <p className="section-subtitle">Check out our popular wholesale items</p>
        
        <div className="products-grid">
          {featuredProducts.map((product) => (
            <div className="product-card-home" key={product.id}>
              <div className="product-image-wrapper">
                <img 
                  src={product.image} 
                  alt={product.name}
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #e9ecef; color: #6c757d; font-size: 48px;">📦</div>';
                  }}
                />
                <span className="product-badge">{product.category}</span>
              </div>
              <div className="product-info-home">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-pricing">
                  <span className="price-label">Wholesale Price:</span>
                  <span className="price">₹{product.wholesalePrice}</span>
                </div>
                <div className="product-moq">
                  <span>MOQ: {product.moq} {product.unit}</span>
                </div>
                <div className="product-actions">
                  <button 
                    className="btn-add-to-cart"
                    onClick={() => handleAddToCart(product)}
                  >
                    🛒 Add to Cart
                  </button>
                  <Link 
                    to={`/product/${product.id}`}
                    className="btn-view-details"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="view-all-products">
          <Link to="/products" className="btn btn-hero-primary">
            View All Products →
          </Link>
        </div>
      </section>

    </main>
  );
}

export default Home;
