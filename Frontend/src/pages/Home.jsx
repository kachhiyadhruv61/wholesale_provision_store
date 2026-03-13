
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useRef } from "react";
import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext";
import { UserContext } from "../context/UserContext";
import Toast from "../components/Toast";

function Home() {
  const navigate = useNavigate();
  const { products } = useContext(ProductContext);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(UserContext);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Get first 8 products for home page slider
  const featuredProducts = products.slice(0, 8);

  const handleAddToCart = (product) => {
    const moqQuantity = product.moq || 1;
    const result = addToCart({ ...product, quantity: moqQuantity });

    if (!result?.success) {
      setToast({
        show: true,
        message: `Insufficient stock for ${result.productName}: requested ${result.requested}, available ${result.available}`,
        type: "warning"
      });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
      return;
    }

    setToast({
      show: true,
      message: `${product.name} (${moqQuantity} ${product.unit}) added to cart!`,
      type: "success"
    });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;
    
    const slider = sliderRef.current;
    const cardWidth = slider.querySelector('.product-card-home').offsetWidth;
    const gap = 24; // Gap between cards
    const scrollAmount = cardWidth + gap;
    
    if (direction === 'next') {
      slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setCurrentSlide(prev => Math.min(prev + 1, featuredProducts.length - 1));
    } else {
      slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setCurrentSlide(prev => Math.max(prev - 1, 0));
    }
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
              Fast checkout, doorstep delivery, and 24/7 support.
            </p>
            <div className="hero-cta-buttons">
              <Link className="btn btn-hero-secondary" to="/products">
                🛍️ Browse Products
              </Link>
              {!user && (
                <Link className="btn btn-hero-primary" to="/register">
                  📝 Create Account
                </Link>
              )}
            </div>
          </div>
          
          <div className="hero-stats-card">
            <div className="stat-item">
              <div className="stat-icon">🚚</div>
              <div className="stat-info">
                <h4>Free Shipping</h4>
                <p>On orders over ₹6000</p>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h4>Wide Product Range</h4>
                <p>Diverse selection of quality items</p>
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

      {/* Why DK TRADERS Section */}
      <section className="why-dk-traders">
        <div className="why-dk-container">
          <h2 className="why-dk-title">Why DK TRADERS?</h2>
          
          <div className="why-dk-grid">
            <div className="why-dk-card">
              <div className="why-dk-icon">🏪</div>
              <h3>Local Wholesale Expertise</h3>
              <p>Years of experience serving local retailers with quality products</p>
            </div>
            
            <div className="why-dk-card">
              <div className="why-dk-icon">📦</div>
              <h3>MOQ & Bulk Pricing Focus</h3>
              <p>Flexible minimum orders and competitive bulk pricing for your business</p>
            </div>
            
            <div className="why-dk-card">
              <div className="why-dk-icon">🚚</div>
              <h3>Fast & Reliable Delivery</h3>
              <p>Quick doorstep delivery ensuring your stock never runs low</p>
            </div>
             
            <div className="why-dk-card">
              <div className="why-dk-icon">🔐</div>
              <h3>Secure B2B Ordering</h3>
              <p>Safe and secure platform built specifically for wholesale transactions</p>
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

      {/* Wholesale Numbers Strip */}
      <section className="wholesale-stats-strip">
        <div className="stats-strip-container">
          <div className="stat-item-strip">
            <div className="stat-icon-strip">🏬</div>
            <div className="stat-content-strip">
              <h3>100+</h3>
              <p>Retailers</p>
            </div>
          </div>
          
          <div className="stat-divider"></div>
          
          <div className="stat-item-strip">
            <div className="stat-icon-strip">📦</div>
            <div className="stat-content-strip">
              <h3>50+</h3>
              <p>Products</p>
            </div>
          </div>
          
          <div className="stat-divider"></div>
          
          <div className="stat-item-strip">
            <div className="stat-icon-strip">🚚</div>
            <div className="stat-content-strip">
              <h3>Daily</h3>
              <p>Bulk Dispatch</p>
            </div>
          </div>
          
          <div className="stat-divider"></div>
          
          <div className="stat-item-strip">
            <div className="stat-icon-strip">⭐</div>
            <div className="stat-content-strip">
              <h3>Trusted</h3>
              <p>in Anand</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products">
        <h2 className="section-title">Featured Products</h2>
        <p className="section-subtitle">Check out our popular wholesale items</p>
        
        <div className="products-slider-container">
          <button 
            className="slider-btn slider-btn-prev" 
            onClick={() => scrollSlider('prev')}
            aria-label="Previous products"
          >
            ‹
          </button>
          
          <div className="products-slider" ref={sliderRef}>
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
          
          <button 
            className="slider-btn slider-btn-next" 
            onClick={() => scrollSlider('next')}
            aria-label="Next products"
          >
            ›
          </button>
        </div>
        
        <div className="view-all-products">
          <Link to="/products" className="btn btn-hero-primary">
            View All Products →
          </Link>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="trust-badges">
        <div className="trust-badges-container">
          <div className="trust-badge-item">
            <span className="trust-badge-icon">✅</span>
            <span className="trust-badge-text">GST Registered</span>
          </div>
          
          <div className="trust-badge-item">
            <span className="trust-badge-icon">✅</span>
            <span className="trust-badge-text">Secure Payments</span>
          </div>
          
          <div className="trust-badge-item">
            <span className="trust-badge-icon">✅</span>
            <span className="trust-badge-text">Local Wholesale Business</span>
          </div>
          
          <div className="trust-badge-item">
            <span className="trust-badge-icon">✅</span>
            <span className="trust-badge-text">Made for Indian Retailers</span>
          </div>
        </div>
      </section>

      {/* Sticky WhatsApp / Call Button */}
      <div className="sticky-contact-buttons">
        <a 
          href="https://wa.me/919876543210?text=Hello%2C%20I%27m%20interested%20in%20your%20wholesale%20products" 
          target="_blank" 
          rel="noopener noreferrer"
          className="sticky-btn sticky-whatsapp"
          aria-label="WhatsApp Support"
        >
          <span className="sticky-icon">💬</span>
          <span className="sticky-text">WhatsApp</span>
        </a>
        
        <a 
          href="tel:+919876543210" 
          className="sticky-btn sticky-call"
          aria-label="Quick Call"
        >
          <span className="sticky-icon">📞</span>
          <span className="sticky-text">Call Now</span>
        </a>
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} />}
    </main>
  );
}

export default Home;
