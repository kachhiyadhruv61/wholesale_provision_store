import { Link } from "react-router-dom";

function Home() {
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
              Fast checkout, doorstep delivery, and 24/7 support.
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
            <div className="stat-item">
              <div className="stat-icon">🚚</div>
              <div className="stat-info">
                <h4>Free Shipping</h4>
                <p>On orders over ₹500</p>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">💬</div>
              <div className="stat-info">
                <h4>24/7 Support</h4>
                <p>We're here to help</p>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🔒</div>
              <div className="stat-info">
                <h4>Secure Payment</h4>
                <p>100% Protected</p>
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

      {/* Features Section */}
      <section className="features-modern">
        <h2 className="section-title">Why Choose DK TRADERS?</h2>
        <p className="section-subtitle">Benefits that make us stand out</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Quick browsing, instant cart updates, and seamless checkout experience</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Best Prices</h3>
            <p>Competitive wholesale prices with exclusive deals and bulk discounts</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Quality Assured</h3>
            <p>All products are verified and quality-checked before delivery</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Modern Platform</h3>
            <p>Built with React for smooth, responsive experience on all devices</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Order Tracking</h3>
            <p>Track your order history and manage your purchases easily</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎁</div>
            <h3>Member Rewards</h3>
            <p>Earn points on every purchase and unlock exclusive benefits</p>
          </div>
        </div>
      </section>

    </main>
  );
}

export default Home;
