import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { OrderContext } from "../context/OrderContext";
import { DeliveryContext } from "../context/DeliveryContext";

function Checkout() {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart } = useContext(CartContext);
  const { addOrder } = useContext(OrderContext);
  const { deliveryLocations, getDeliveryInfo, calculateCustomDelivery } = useContext(DeliveryContext);

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState("details");
  const [deliveryType, setDeliveryType] = useState("location");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryPincode: "",
    specialInstructions: "",
    customDistance: "",
  });

  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCVV: "",
    upiId: "",
    bankAccountNumber: "",
    bankIfsc: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location.id);
    const info = getDeliveryInfo(location.id, totalPrice);
    setDeliveryInfo(info);
    setDeliveryCharge(info.finalCharge);
  };

  const handleCustomDistance = () => {
    if (!formData.customDistance || isNaN(formData.customDistance)) {
      alert("Please enter a valid distance");
      return;
    }
    const distance = parseFloat(formData.customDistance);
    const info = calculateCustomDelivery(distance, totalPrice);
    setDeliveryInfo(info);
    setDeliveryCharge(info.finalCharge);
  };

  const validateDeliveryDetails = () => {
    if (!formData.deliveryAddress || !formData.deliveryCity || !formData.deliveryState || !formData.deliveryPincode) {
      alert("Please fill all delivery details");
      return false;
    }
    if (deliveryType === "location" && !selectedLocation) {
      alert("Please select a delivery location");
      return false;
    }
    if (deliveryType === "custom" && !formData.customDistance) {
      alert("Please enter delivery distance");
      return false;
    }
    return true;
  };

  const validatePaymentDetails = () => {
    if (paymentMethod === "card") {
      if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.cardExpiry || !paymentData.cardCVV) {
        alert("Please fill all card details");
        return false;
      }
    } else if (paymentMethod === "upi") {
      if (!paymentData.upiId) {
        alert("Please enter your UPI ID");
        return false;
      }
    } else if (paymentMethod === "bank") {
      if (!paymentData.bankAccountNumber || !paymentData.bankIfsc) {
        alert("Please fill bank transfer details");
        return false;
      }
    }
    return true;
  };

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    if (validateDeliveryDetails()) {
      setPaymentStep("payment");
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();

    if (!validatePaymentDetails()) {
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentStep("success");

      const order = {
        items: cart,
        subtotal: totalPrice,
        deliveryCharge: deliveryCharge,
        total: totalPrice + deliveryCharge,
        paymentMethod,
        paymentStatus: "Completed",
        deliveryAddress: formData.deliveryAddress,
        deliveryCity: formData.deliveryCity,
        deliveryState: formData.deliveryState,
        deliveryPincode: formData.deliveryPincode,
        deliveryLocation: selectedLocation,
        deliveryInfo: deliveryInfo,
        specialInstructions: formData.specialInstructions,
        status: "Confirmed",
        orderDate: new Date().toISOString(),
      };

      addOrder(order);
      clearCart();

      setTimeout(() => {
        navigate("/order-success");
      }, 2000);
    }, 2000);
  };

  const finalTotal = totalPrice + deliveryCharge;

  if (cart.length === 0 && paymentStep === "details") {
    return (
      <div className="checkout-page">
        <div className="empty-checkout">
          <div className="empty-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Add products to your cart before checkout</p>
          <button onClick={() => navigate("/products")} className="btn-continue-shopping">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>

      {/* Step Indicator */}
      <div className="checkout-steps">
        <div className={`step ${paymentStep === "details" ? "active" : paymentStep === "payment" || paymentStep === "success" ? "completed" : ""}`}>
          <div className="step-number">1</div>
          <div className="step-label">Delivery Details</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${paymentStep === "payment" ? "active" : paymentStep === "success" ? "completed" : ""}`}>
          <div className="step-number">2</div>
          <div className="step-label">Payment</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${paymentStep === "success" ? "active completed" : ""}`}>
          <div className="step-number">✓</div>
          <div className="step-label">Confirm</div>
        </div>
      </div>

      <div className="checkout-container">
        {/* Order Summary */}
        <div className="checkout-section order-summary">
          <h3>📦 Order Summary</h3>
          {cart.length > 0 ? (
            <div className="summary-content">
              <div className="summary-items">
                {cart.map((item, index) => (
                  <div key={index} className="summary-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">x{item.quantity}</span>
                    <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-divider"></div>
              
              <div className="summary-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal:</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                {deliveryCharge > 0 && (
                  <div className="breakdown-row">
                    <span>Delivery Charge:</span>
                    <span>₹{deliveryCharge.toFixed(2)}</span>
                  </div>
                )}
                {deliveryCharge === 0 && deliveryInfo && (
                  <div className="breakdown-row discount">
                    <span>🎉 Free Delivery!</span>
                    <span className="free-badge">₹0</span>
                  </div>
                )}
              </div>

              <div className="summary-divider"></div>
              <div className="summary-total">
                <span>Total Amount:</span>
                <span className="total-price">₹{finalTotal.toFixed(2)}</span>
              </div>
              
              {deliveryInfo && (
                <div className="delivery-estimate">
                  ⏱️ Estimated Delivery: {deliveryInfo.estimatedDeliveryText}
                </div>
              )}
            </div>
          ) : (
            <p className="empty-cart">Your cart is empty</p>
          )}
        </div>

        {/* Delivery Details Step */}
        {paymentStep === "details" && (
          <div className="checkout-section delivery-details">
            <h3>🚚 Delivery Details</h3>
            <form onSubmit={handleContinueToPayment}>
              
              {/* Delivery Location Selector */}
              <div className="form-section">
                <h4>Select Delivery Location</h4>
                
                <div className="location-type-selector">
                  <label className="type-option">
                    <input
                      type="radio"
                      value="location"
                      checked={deliveryType === "location"}
                      onChange={(e) => setDeliveryType(e.target.value)}
                    />
                    <span>📍 Pre-defined Location</span>
                  </label>
                  <label className="type-option">
                    <input
                      type="radio"
                      value="custom"
                      checked={deliveryType === "custom"}
                      onChange={(e) => setDeliveryType(e.target.value)}
                    />
                    <span>🗺️ Custom Distance</span>
                  </label>
                </div>

                {deliveryType === "location" ? (
                  <div className="locations-grid">
                    {deliveryLocations.map(location => (
                      <div
                        key={location.id}
                        className={`location-card ${selectedLocation === location.id ? "selected" : ""}`}
                        onClick={() => handleLocationSelect(location)}
                      >
                        <div className="location-name">{location.name}</div>
                        <div className="location-distance">
                          <span>📏 {location.distance} km</span>
                        </div>
                        <div className="location-charge">
                          {getDeliveryInfo(location.id, totalPrice).finalCharge === 0 ? (
                            <span className="free-charge">Free</span>
                          ) : (
                            <span className="charge-amount">
                              ₹{getDeliveryInfo(location.id, totalPrice).finalCharge}
                            </span>
                          )}
                        </div>
                        {selectedLocation === location.id && (
                          <div className="selected-badge">✓ Selected</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="custom-distance-input">
                    <label>Enter Distance (in km) *</label>
                    <div className="distance-input-group">
                      <input
                        type="number"
                        name="customDistance"
                        placeholder="e.g., 5.5"
                        value={formData.customDistance}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0"
                      />
                      <button type="button" onClick={handleCustomDistance} className="btn-calculate">
                        Calculate Charge
                      </button>
                    </div>
                    {deliveryInfo && (
                      <div className="charge-info">
                        <p>Distance: {deliveryInfo.distance} km</p>
                        <p>Delivery Charge: ₹{deliveryInfo.finalCharge}</p>
                        <p>Estimated Time: {deliveryInfo.estimatedDeliveryText}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Address Details */}
              <div className="form-section">
                <h4>Delivery Address</h4>
                
                <div className="form-group">
                  <label htmlFor="deliveryAddress">
                    <span className="form-icon">📍</span>
                    Delivery Address *
                  </label>
                  <textarea
                    id="deliveryAddress"
                    name="deliveryAddress"
                    placeholder="Enter your complete shop address"
                    value={formData.deliveryAddress}
                    onChange={handleInputChange}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="deliveryCity">
                      <span className="form-icon">🌆</span>
                      City *
                    </label>
                    <input
                      id="deliveryCity"
                      type="text"
                      name="deliveryCity"
                      placeholder="e.g., Anand"
                      value={formData.deliveryCity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="deliveryState">
                      <span className="form-icon">🗺️</span>
                      State *
                    </label>
                    <input
                      id="deliveryState"
                      type="text"
                      name="deliveryState"
                      placeholder="e.g., Gujarat"
                      value={formData.deliveryState}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="deliveryPincode">
                      <span className="form-icon">📮</span>
                      PIN Code *
                    </label>
                    <input
                      id="deliveryPincode"
                      type="text"
                      name="deliveryPincode"
                      placeholder="e.g., 388001"
                      value={formData.deliveryPincode}
                      onChange={handleInputChange}
                      pattern="[0-9]{6}"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="specialInstructions">
                    <span className="form-icon">📝</span>
                    Special Instructions
                  </label>
                  <textarea
                    id="specialInstructions"
                    name="specialInstructions"
                    placeholder="Any special delivery instructions (Optional)"
                    value={formData.specialInstructions}
                    onChange={handleInputChange}
                    rows="2"
                  />
                </div>
              </div>

              <button type="submit" className="btn-continue">
                Continue to Payment →
              </button>
            </form>
          </div>
        )}

        {/* Payment Step */}
        {paymentStep === "payment" && (
          <div className="checkout-section payment-section">
            <h3>💳 Payment Method</h3>
            
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-label">
                  <span className="payment-icon">🚚</span>
                  <span className="payment-text">
                    <strong>Cash on Delivery (COD)</strong>
                    <small>Pay when you receive your order</small>
                  </span>
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-label">
                  <span className="payment-icon">📱</span>
                  <span className="payment-text">
                    <strong>UPI Payment</strong>
                    <small>Google Pay, PhonePe, Paytm</small>
                  </span>
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-label">
                  <span className="payment-icon">💳</span>
                  <span className="payment-text">
                    <strong>Debit/Credit Card</strong>
                    <small>Secure card payment</small>
                  </span>
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={paymentMethod === "bank"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-label">
                  <span className="payment-icon">🏦</span>
                  <span className="payment-text">
                    <strong>Bank Transfer</strong>
                    <small>Direct bank deposit / NEFT / RTGS</small>
                  </span>
                </span>
              </label>
            </div>

            {/* COD Info */}
            {paymentMethod === "cod" && (
              <div className="payment-form cod-info">
                <h4>Cash on Delivery</h4>
                <p>You can pay the exact amount in cash when the delivery executive arrives at your doorstep.</p>
                <div className="cod-amount">
                  <strong>Amount to Pay:</strong> ₹{finalTotal.toFixed(2)}
                </div>
                <button type="button" onClick={handleProcessPayment} className="btn-confirm-payment" disabled={isProcessingPayment}>
                  {isProcessingPayment ? "Processing..." : "Confirm Order"}
                </button>
              </div>
            )}

            {/* UPI Form */}
            {paymentMethod === "upi" && (
              <form className="payment-form" onSubmit={handleProcessPayment}>
                <h4>UPI Payment</h4>
                <div className="form-group">
                  <label htmlFor="upiId">UPI ID *</label>
                  <input
                    id="upiId"
                    type="text"
                    name="upiId"
                    placeholder="yourname@upi"
                    value={paymentData.upiId}
                    onChange={handlePaymentInputChange}
                    required
                  />
                </div>
                <button type="submit" className="btn-confirm-payment" disabled={isProcessingPayment}>
                  {isProcessingPayment ? "Processing Payment..." : `Pay ₹${finalTotal.toFixed(2)}`}
                </button>
              </form>
            )}

            {/* Card Form */}
            {paymentMethod === "card" && (
              <form className="payment-form" onSubmit={handleProcessPayment}>
                <h4>Card Payment</h4>
                <div className="form-group">
                  <label htmlFor="cardNumber">Card Number *</label>
                  <input
                    id="cardNumber"
                    type="text"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={handlePaymentInputChange}
                    pattern="[0-9\s]{16,19}"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cardName">Cardholder Name *</label>
                  <input
                    id="cardName"
                    type="text"
                    name="cardName"
                    placeholder="JOHN DOE"
                    value={paymentData.cardName}
                    onChange={handlePaymentInputChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cardExpiry">Expiry (MM/YY) *</label>
                    <input
                      id="cardExpiry"
                      type="text"
                      name="cardExpiry"
                      placeholder="12/25"
                      value={paymentData.cardExpiry}
                      onChange={handlePaymentInputChange}
                      pattern="\d{2}/\d{2}"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cardCVV">CVV *</label>
                    <input
                      id="cardCVV"
                      type="text"
                      name="cardCVV"
                      placeholder="123"
                      value={paymentData.cardCVV}
                      onChange={handlePaymentInputChange}
                      pattern="\d{3,4}"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-confirm-payment" disabled={isProcessingPayment}>
                  {isProcessingPayment ? "Processing Payment..." : `Pay ₹${finalTotal.toFixed(2)}`}
                </button>
              </form>
            )}

            {/* Bank Transfer */}
            {paymentMethod === "bank" && (
              <form className="payment-form" onSubmit={handleProcessPayment}>
                <h4>Bank Transfer Details</h4>
                <div className="bank-details-display">
                  <p><strong>Account Name:</strong> DK TRADERS Wholesale</p>
                  <p><strong>Account Number:</strong> 123456789012345</p>
                  <p><strong>IFSC Code:</strong> SBIN0001234</p>
                  <p><strong>Bank Name:</strong> State Bank of India</p>
                </div>
                <div className="form-group">
                  <label htmlFor="bankAccountNumber">Your Account Number *</label>
                  <input
                    id="bankAccountNumber"
                    type="text"
                    name="bankAccountNumber"
                    placeholder="Enter your account number"
                    value={paymentData.bankAccountNumber}
                    onChange={handlePaymentInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bankIfsc">Your Bank IFSC Code *</label>
                  <input
                    id="bankIfsc"
                    type="text"
                    name="bankIfsc"
                    placeholder="SBIN0001234"
                    value={paymentData.bankIfsc}
                    onChange={handlePaymentInputChange}
                    required
                  />
                </div>
                <button type="submit" className="btn-confirm-payment" disabled={isProcessingPayment}>
                  {isProcessingPayment ? "Processing..." : "Confirm Transfer"}
                </button>
              </form>
            )}

            <button type="button" onClick={() => setPaymentStep("details")} className="btn-back">
              ← Back
            </button>
          </div>
        )}

        {/* Success Step */}
        {paymentStep === "success" && (
          <div className="checkout-section success-section">
            <div className="success-animation">
              <div className="success-icon">✓</div>
            </div>
            <h3>Payment Successful!</h3>
            <p>Your order has been confirmed.</p>
            <div className="success-details">
              <p><strong>Payment Method:</strong> {paymentMethod.toUpperCase()}</p>
              <p><strong>Subtotal:</strong> ₹{totalPrice.toFixed(2)}</p>
              <p><strong>Delivery Charge:</strong> ₹{deliveryCharge.toFixed(2)}</p>
              <p><strong>Total Amount Paid:</strong> ₹{finalTotal.toFixed(2)}</p>
              <p><strong>Status:</strong> <span className="status-badge confirmed">Confirmed</span></p>
              {deliveryInfo && <p><strong>Est. Delivery:</strong> {deliveryInfo.estimatedDeliveryText}</p>}
            </div>
            <p className="redirecting">Redirecting to order confirmation...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;
