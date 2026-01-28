import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";

function Cart() {
  const { cart, removeFromCart, totalPrice, incrementQuantity, decrementQuantity } = useContext(CartContext);
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty. Please add products before checkout");
      return;
    }
    navigate("/checkout");
  };

  const handleContinueShopping = () => {
    navigate("/products");
  };

  return (
    <div className={`cart-page${cart.length === 0 ? " empty-cart" : ""}`}>
      <h2>🛒 Your Shopping Cart</h2>

      <div className={`cart-content${cart.length === 0 ? " cart-content-empty" : ""}`}>
        <div className="cart-items-section">
          {cart.length === 0 ? (
            <div className="empty-cart-message">
              <div className="empty-cart-icon">🛒</div>
              <p>Your cart is empty</p>
              <button onClick={handleContinueShopping} className="btn-continue">
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <h3 className="items-header">Items ({cart.length})</h3>
              <div className="cart-items-list">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-meta">
                        <div className="quantity-controls">
                          <button
                            className="qty-btn"
                            onClick={() => decrementQuantity(index)}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="quantity-display">{item.quantity || 1}</span>
                          <button
                            className="qty-btn"
                            onClick={() => incrementQuantity(index)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className="item-unit">{item.unit || "Unit"}</span>
                        <span className="unit-price">@ ₹{item.price.toFixed(2)} / {item.unit || "Unit"}</span>
                        <span className="bulk-pill">Auto bulk pricing</span>
                      </div>
                    </div>
                    <div className="item-price">
                      <span className="price">₹{(item.price * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="btn-remove"
                      title="Remove from cart"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-summary-section">
            <div className="cart-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-breakdown">
                <div className="summary-row">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Charges</span>
                  <span className="free">FREE</span>
                </div>
                <div className="summary-row discount">
                  <span>Wholesale Discount</span>
                  <span>Applied</span>
                </div>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total Amount</span>
                <span className="total-amount">₹{totalPrice.toFixed(2)}</span>
              </div>

              <div className="summary-note">
                <small>✓ Free delivery on wholesale orders</small>
                <small>✓ Secure checkout</small>
                <small>✓ Multiple payment options</small>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="btn-checkout"
              >
                <span>Proceed to Checkout</span>
                <span className="arrow">→</span>
              </button>

              <button
                onClick={handleContinueShopping}
                className="btn-continue-shopping"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
