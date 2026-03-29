import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { ProductContext } from "../context/ProductContext";
import Toast from "../components/Toast";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { products = [], getPriceForQuantity } = useContext(ProductContext);
  
  const [selectedQuantity, setSelectedQuantity] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [inputQuantity, setInputQuantity] = useState(1);
  const [toast, setToast] = useState(null);

  const normalizedRouteId = String(id || "").trim();
  const product = (products || []).find(
    (p) => String(p?.id) === normalizedRouteId || String(p?._id || "") === normalizedRouteId
  );

  useEffect(() => {
    if (product) {
      const normalizedMOQ = Math.max(1, Number(product.moq || product.MOQ || 1));
      setSelectedQuantity(normalizedMOQ);
      setInputQuantity(normalizedMOQ);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="product-not-found">
          <h2>Product not found</h2>
          <button onClick={() => navigate('/products')} className="back-btn">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const displayCategory = (category) => (category === "Grains" ? "Grocery" : category);
  const productMOQ = Math.max(1, Number(product.moq || product.MOQ || 1));
  const currentPrice = getPriceForQuantity(product.id, selectedQuantity || productMOQ);
  const hasDiscount = currentPrice < product.price;
  const fallbackPrice = Number(getPriceForQuantity(product.id, productMOQ) || product.price || 0);
  const normalizedBulkPricing = Array.isArray(product.bulkPricing)
    ? product.bulkPricing
        .map((tier) => ({
          quantity: Number(tier?.quantity || 0),
          price: Number(tier?.price || 0),
        }))
        .filter((tier) => Number.isFinite(tier.quantity) && tier.quantity > 0 && Number.isFinite(tier.price) && tier.price >= 0)
        .sort((a, b) => a.quantity - b.quantity)
    : [];

  const moqTierExists = normalizedBulkPricing.some((tier) => tier.quantity === productMOQ);
  const unitOptions = [
    ...(moqTierExists ? [] : [{ quantity: productMOQ, price: fallbackPrice }]),
    ...normalizedBulkPricing.filter((tier) => tier.quantity >= productMOQ),
  ]
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 3);

  const handleAddToCart = () => {
    if (inputQuantity < productMOQ) {
      setToast({
        message: `Minimum Order Quantity (MOQ) for ${product.name} is ${productMOQ} ${product.unit}(s)`,
        type: "warning"
      });
      return;
    }

    const result = addToCart({
      ...product,
      quantity: inputQuantity,
      price: getPriceForQuantity(product.id, inputQuantity)
    });

    if (!result?.success) {
      setToast({
        message: `Insufficient stock for ${result.productName}: requested ${result.requested}, available ${result.available}`,
        type: "warning"
      });
      return;
    }

    setToast({
      message: `✨ Added ${inputQuantity} ${product.unit}(s) of ${product.name} to cart!`,
      type: "success"
    });
  };

  // Create thumbnail images array (in real app, product would have multiple images)
  const thumbnailImages = [product.image, product.image, product.image];

  return (
    <div className="product-detail-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">/</span>
        <Link to="/products">{displayCategory(product.category)}</Link>
        <span className="separator">/</span>
        <span className="current">{product.name}</span>
      </div>

      <div className="product-detail-container">
        {/* Left Side - Image */}
        <div className="product-image-section">
          <div className="main-image">
            <img 
              src={product.image || `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              onError={(e) => {
                e.target.src = `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`;
              }}
            />
          </div>
          
          {/* Thumbnail Images */}
          <div className="thumbnail-images">
            {thumbnailImages.map((img, idx) => (
              <div 
                key={idx} 
                className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                onClick={() => setSelectedImage(idx)}
              >
                <img 
                  src={img || `https://placehold.co/80x80?text=${encodeURIComponent(product.name)}`}
                  alt={`${product.name} thumbnail ${idx + 1}`}
                  onError={(e) => {
                    e.target.src = `https://placehold.co/80x80?text=${encodeURIComponent(product.name)}`;
                  }}
                />
              </div>
            ))}
            <button className="thumbnail-next">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Right Side - Product Info */}
        <div className="product-info-section">
          <h1 className="product-title">{product.name}</h1>
          
          {/* Unit Selection */}
          <div className="unit-selection">
            <h3>Select Unit</h3>
            <div className="unit-options">
              {unitOptions.map((tier, idx) => {
                const quantity = tier.quantity;
                const price = tier.price;
                const isFirst = idx === 0;
                const discountPercent = isFirst ? Math.round((1 - price / product.price) * 100) : 0;
                
                return (
                  <div 
                    key={idx}
                    className={`unit-option ${selectedQuantity === quantity ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedQuantity(quantity);
                      setInputQuantity(quantity);
                    }}
                  >
                    {discountPercent > 0 && (
                      <div className="discount-badge">{discountPercent}% OFF</div>
                    )}
                    <div className="unit-details">
                      <div className="unit-quantity">{quantity} {product.unit}</div>
                      <div className="unit-price">₹{price}</div>
                      {product.price > price && (
                        <div className="unit-original-price">₹{product.price}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="price-cart-section">
            <div className="price-info">
              <div className="quantity-label">{selectedQuantity} {product.unit}</div>
              <div className="price-display-detail">
                <span className="current-price-detail">₹{currentPrice}</span>
                {hasDiscount && (
                  <>
                    <span className="original-price-detail">MRP ₹{product.price}</span>
                    <span className="discount-badge-inline">
                      {Math.round((1 - currentPrice / product.price) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              <div className="tax-info">(Inclusive of all taxes)</div>
            </div>
            
            <button className="add-to-cart-btn-detail" onClick={handleAddToCart}>
              Add to cart
            </button>
          </div>

          {/* Custom Quantity Input */}
          <div className="custom-quantity-section">
            <label htmlFor="quantity">Custom Quantity (Min: {productMOQ} {product.unit})</label>
            <input
              id="quantity"
              type="number"
              min={productMOQ}
              value={inputQuantity}
              onChange={(e) => setInputQuantity(parseInt(e.target.value, 10) || productMOQ)}
              className="custom-quantity-input"
            />
          </div>

          {/* Why Shop Section */}
          <div className="why-shop-section">
            <h3>Why shop from our store?</h3>
            
            <div className="benefit-item">
              <div className="benefit-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="#FFF4E6"/>
                  <path d="M24 16v12l6 3" stroke="#FF9800" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="24" cy="24" r="10" stroke="#FF9800" strokeWidth="2"/>
                </svg>
              </div>
              <div className="benefit-content">
                <h4>Fast Delivery</h4>
                <p>Get items delivered to your doorstep from stores near you, whenever you need them.</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="#FFF9E6"/>
                  <path d="M20 24l4 4 8-8" stroke="#FFB800" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="24" cy="24" r="10" stroke="#FFB800" strokeWidth="2"/>
                </svg>
              </div>
              <div className="benefit-content">
                <h4>Best Prices & Offers</h4>
                <p>Best price destination with offers directly from the manufacturers.</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="#FFF4E6"/>
                  <rect x="18" y="20" width="6" height="8" stroke="#FF9800" strokeWidth="2"/>
                  <rect x="26" y="16" width="6" height="12" stroke="#FF9800" strokeWidth="2"/>
                  <rect x="18" y="20" width="14" height="2" fill="#FF9800"/>
                </svg>
              </div>
              <div className="benefit-content">
                <h4>Wide Assortment</h4>
                <p>Choose from {products.length}+ products across food, grocery, and other categories.</p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="product-details-section">
            <h3>Product Details</h3>
            <div className="detail-row">
              <span className="detail-label">Category:</span>
              <span className="detail-value">{displayCategory(product.category)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Unit:</span>
              <span className="detail-value">{product.unit}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Minimum Order:</span>
              <span className="detail-value">{productMOQ} {product.unit}(s)</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Stock Available:</span>
              <span className="detail-value">{product.stock} units</span>
            </div>
            {product.description && (
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{product.description}</span>
              </div>
            )}
          </div>

          {/* Bulk Pricing Table */}
          <div className="bulk-pricing-section">
            <h3>Bulk Pricing</h3>
            <table className="bulk-pricing-table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th>Price per unit</th>
                  <th>You Save</th>
                </tr>
              </thead>
              <tbody>
                {product.bulkPricing.map((tier, idx) => (
                  <tr key={idx}>
                    <td>{tier.quantity}+ {product.unit}(s)</td>
                    <td>₹{tier.price}</td>
                    <td className="savings">
                      {tier.price < product.price ? (
                        <>₹{product.price - tier.price} ({Math.round((1 - tier.price / product.price) * 100)}% OFF)</>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default ProductDetail;
