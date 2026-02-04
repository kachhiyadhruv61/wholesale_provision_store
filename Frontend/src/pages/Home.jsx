import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext";
import Toast from "../components/Toast";

function Home() {
  const navigate = useNavigate();
  const { products } = useContext(ProductContext);
  const { addToCart } = useContext(CartContext);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
  // Get first 6 products for home page
  const featuredProducts = products.slice(0, 6);

  const handleAddToCart = (product) => {
    const moqQuantity = product.moq || 1;
    addToCart({ ...product, quantity: moqQuantity });
    setToast({
      show: true,
      message: `${product.name} (${moqQuantity} ${product.unit}) added to cart!`,
      type: "success"
    });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
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
                <p>On orders over ₹5000</p>
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

      {toast.show && <Toast message={toast.message} type={toast.type} />}
    </main>
  );
}

export default Home;
