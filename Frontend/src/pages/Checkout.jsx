import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { OrderContext } from "../context/OrderContext";
import { UserContext } from "../context/UserContext";
import { ProductContext } from "../context/ProductContext";
import { NotificationContext } from "../context/NotificationContext";
import { DeliveryContext } from "../context/DeliveryContext";
import { calculateDeliveryEta } from "../utils/deliveryEta";
import { calculateCartBilling, formatInvoiceText, generateInvoice } from "../utils/gst";
import { getPincodeDeliveryMessage, isServiceablePincode, sanitizePincode } from "../utils/serviceablePincodes";
import { apiClient } from "../utils/apiClient";

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_SU9OILjNd5mGst";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function Checkout() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { cart, totalPrice, deliveryCharge, clearCart, totalGst, grandTotal } = useContext(CartContext);
  const { addOrder, updateOrderPaymentDetails } = useContext(OrderContext);
  const { deductStockForOrder, validateStockForOrder, products } = useContext(ProductContext);
  const { addNotification } = useContext(NotificationContext);
  const { deliveryLocations } = useContext(DeliveryContext);

  // Redirect to login if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState("details");
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [pincodeStatus, setPincodeStatus] = useState({
    checked: false,
    isValid: false,
    message: "",
  });
  
  const [formData, setFormData] = useState({
    customerName: user?.username || "",
    shopName: user?.shopName || user?.shopname || "",
    deliveryAddress: user?.address || "",
    deliveryCity: user?.city || "",
    deliveryState: user?.state || "",
    deliveryPincode: user?.pincode || "",
    specialInstructions: "",
  });

  const isUpiPayment = paymentMethod === "upi";

  // Auto-populate delivery details when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        customerName: user.username || "",
        shopName: user.shopName || user.shopname || "",
        deliveryAddress: user.address || "",
        deliveryCity: user.city || "",
        deliveryState: user.state || "",
        deliveryPincode: user.pincode || "",
        specialInstructions: "",
      });
    }
  }, [user]);

  // Fetch latest profile details from register data and prefill checkout form.
  useEffect(() => {
    let isMounted = true;

    const hydrateProfileFromRegister = async () => {
      if (!user) return;

      const email = String(user.email || "").trim().toLowerCase();
      const username = String(user.username || "").trim().toLowerCase();
      if (!email && !username) return;

      try {
        const response = await apiClient.get("/api/register");
        const registers = Array.isArray(response?.data) ? response.data : [];
        const matched = registers.find((entry) => {
          const entryEmail = String(entry?.email || "").trim().toLowerCase();
          const entryUsername = String(entry?.username || "").trim().toLowerCase();
          return (email && entryEmail === email) || (username && entryUsername === username);
        });

        if (!isMounted) return;

        const resolvedProfile = {
          customerName: String(matched?.fullname || matched?.username || user?.username || "").trim(),
          shopName: String(matched?.shopname || matched?.shopName || user?.shopName || user?.shopname || "").trim(),
          deliveryAddress: String(matched?.shopaddress || user?.address || "").trim(),
          deliveryCity: String(matched?.city || user?.city || "").trim(),
          deliveryState: String(matched?.state || user?.state || "").trim(),
          deliveryPincode: sanitizePincode(String(matched?.pincode || user?.pincode || "")),
        };

        setFormData((prev) => {
          const hasChanged =
            String(prev.customerName || "") !== resolvedProfile.customerName ||
            String(prev.shopName || "") !== resolvedProfile.shopName ||
            String(prev.deliveryAddress || "") !== resolvedProfile.deliveryAddress ||
            String(prev.deliveryCity || "") !== resolvedProfile.deliveryCity ||
            String(prev.deliveryState || "") !== resolvedProfile.deliveryState ||
            String(prev.deliveryPincode || "") !== resolvedProfile.deliveryPincode;

          if (!hasChanged) return prev;
          return { ...prev, ...resolvedProfile };
        });

        const resolvedPincodeValid =
          resolvedProfile.deliveryPincode.length === 6 && isServiceablePincode(resolvedProfile.deliveryPincode);
        setPincodeStatus({
          checked: resolvedProfile.deliveryPincode.length === 6,
          isValid: resolvedPincodeValid,
          message:
            resolvedProfile.deliveryPincode.length === 6
              ? getPincodeDeliveryMessage(resolvedProfile.deliveryPincode)
              : "",
        });
      } catch {
        // Silent fallback to locally available user data.
      }
    };

    hydrateProfileFromRegister();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "deliveryPincode") {
      const normalized = sanitizePincode(value);
      const isValid = normalized.length === 6 && isServiceablePincode(normalized);
      const message = normalized.length === 6 ? getPincodeDeliveryMessage(normalized) : "";

      setFormData({ ...formData, [name]: normalized });
      setPincodeStatus({
        checked: normalized.length === 6,
        isValid,
        message,
      });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleCheckPincode = () => {
    const normalized = sanitizePincode(formData.deliveryPincode);
    const isValid = isServiceablePincode(normalized);
    const message = getPincodeDeliveryMessage(normalized);

    setFormData((prev) => ({ ...prev, deliveryPincode: normalized }));
    setPincodeStatus({
      checked: true,
      isValid,
      message,
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const validateDeliveryDetails = () => {
    if (!formData.customerName || !formData.shopName || !formData.deliveryAddress || !formData.deliveryCity || !formData.deliveryState || !formData.deliveryPincode) {
      alert("Please fill all delivery details");
      return false;
    }

    const normalizedPincode = sanitizePincode(formData.deliveryPincode);
    const pincodeValid = isServiceablePincode(normalizedPincode);

    setFormData((prev) => ({ ...prev, deliveryPincode: normalizedPincode }));
    setPincodeStatus({
      checked: true,
      isValid: pincodeValid,
      message: getPincodeDeliveryMessage(normalizedPincode),
    });

    if (!pincodeValid) {
      alert("Sorry, delivery is not available in your area yet.");
      return false;
    }

    return true;
  };

  const validatePaymentDetails = () => true;

  const resolveDistanceFromForm = () => {
    const city = String(formData.deliveryCity || "").trim().toLowerCase();
    const state = String(formData.deliveryState || "").trim().toLowerCase();

    const matchedLocation = deliveryLocations.find(
      (location) =>
        String(location.city || "").trim().toLowerCase() === city &&
        String(location.state || "").trim().toLowerCase() === state
    );

    if (matchedLocation) {
      return matchedLocation.distance;
    }

    return 12;
  };

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    
    if (validateDeliveryDetails()) {
      const now = new Date();
      const distanceKm = resolveDistanceFromForm();
      const eta = calculateDeliveryEta({ distanceKm, orderDate: now });
      setDeliveryInfo(eta);
      setPaymentStep("payment");
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();

    if (!validatePaymentDetails()) {
      return;
    }

    const stockValidation = validateStockForOrder(cart);
    if (!stockValidation.ok) {
      const detail = stockValidation.shortages
        .map((entry) => `${entry.name}: requested ${entry.requested}, available ${entry.available}`)
        .join("\n");
      alert(`Insufficient stock for selected items:\n${detail}`);
      return;
    }

    setIsProcessingPayment(true);

    const gstBilling = calculateCartBilling(cart);
    const invoice = generateInvoice({
      shopName: "Wholesale Store",
      items: cart,
      dateTime: new Date().toISOString(),
      deliveryCharge,
    });
    setLastInvoice(invoice);

    const order = {
      items: gstBilling.items,
      subtotal: totalPrice,
      subtotalBeforeGst: gstBilling.subtotalBeforeGst,
      totalGst: gstBilling.totalGst,
      subtotalAfterGst: gstBilling.subtotalAfterGst,
      deliveryCharge: deliveryCharge,
      total: gstBilling.subtotalAfterGst + deliveryCharge,
      invoice,
      invoiceText: formatInvoiceText(invoice),
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Pending",
      transactionId: "",
      customerId: user?.id,
      customerUsername: user?.username,
      customerEmail: user?.email,
      customerPhone: user?.phone || user?.phonenumber || "",
      customerName: formData.customerName,
      customerShopName: formData.shopName,
      deliveryAddress: formData.deliveryAddress,
      deliveryCity: formData.deliveryCity,
      deliveryState: formData.deliveryState,
      deliveryPincode: formData.deliveryPincode,
      deliveryLocation: null,
      deliveryInfo,
      deliveryDistanceKm: deliveryInfo?.distanceKm ?? null,
      estimatedDeliveryHours: deliveryInfo?.estimatedDeliveryHours ?? null,
      estimatedDeliveryAt: deliveryInfo?.estimatedDeliveryAt ?? null,
      nextDayDelivery: Boolean(deliveryInfo?.nextDayDelivery),
      specialInstructions: formData.specialInstructions,
      status: "Confirmed",
      orderDate: new Date().toISOString(),
    };

    let createdOrder;
    try {
      createdOrder = await addOrder(order);
    } catch (error) {
      setIsProcessingPayment(false);
      setPaymentStep("payment");
      alert(error?.message || "Order could not be saved to server. Please try again.");
      return;
    }

    if (!createdOrder) {
      setIsProcessingPayment(false);
      setPaymentStep("payment");
      alert("Order could not be saved to server. Please try again.");
      return;
    }

    const orderId = createdOrder?.id ?? "new";

    const finalizeSuccessFlow = () => {
      setPaymentStep("success");

      addNotification({
        type: "order",
        title: "New order received",
        message: `Order #${orderId} placed for ₹${(order.total || 0).toFixed(2)}.`,
        meta: {
          customer: formData.customerName,
          items: cart.length,
          total: order.total,
        },
      });

      const lowStockThreshold = 50;
      cart.forEach((item) => {
        const product = products.find((p) => p.id === item.id);
        if (!product) return;
        const currentStock = Number(product.stock || 0);
        const nextStock = Math.max(currentStock - Number(item.quantity || 0), 0);

        if (currentStock >= lowStockThreshold && nextStock < lowStockThreshold) {
          addNotification({
            type: "stock",
            title: "Low stock alert",
            message: `${product.name} is low on stock (${nextStock} left).`,
            meta: {
              product: product.name,
              stock: nextStock,
            },
          });
        }
      });

      deductStockForOrder(cart, { syncBackend: false });
      clearCart();

      setTimeout(() => {
        navigate("/order-success");
      }, 2000);
    };

    // COD uses normal confirmation flow.
    if (paymentMethod === "cod") {
      setIsProcessingPayment(false);
      finalizeSuccessFlow();
      return;
    }

    // Online payment uses Razorpay checkout flow.
    try {
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        throw new Error("Razorpay SDK failed to load");
      }

      const createOrderResponse = await apiClient.post("/create-order", {
        amount: order.total,
        currency: "INR",
        orderId,
      });

      if (!createOrderResponse?.order_id) {
        throw new Error("Unable to create Razorpay order");
      }

      const paymentResponse = await new Promise((resolve, reject) => {
        const razorpayInstance = new window.Razorpay({
          key: RAZORPAY_KEY_ID,
          amount: createOrderResponse.amount,
          currency: createOrderResponse.currency,
          name: "Wholesale Store",
          description: `Order #${orderId}`,
          order_id: createOrderResponse.order_id,
          prefill: {
            name: formData.customerName || user?.username || "",
            email: user?.email || "",
            contact: user?.phone || user?.phonenumber || "",
          },
          notes: {
            appOrderId: String(orderId),
            paymentMethod,
          },
          ...(isUpiPayment
            ? {
                method: {
                  upi: true,
                  card: true,
                  netbanking: true,
                  wallet: true,
                },
              }
            : {}),
          handler: (response) => resolve(response),
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled by user")),
          },
        });

        razorpayInstance.on("payment.failed", (event) => {
          reject(new Error(event?.error?.description || "Razorpay payment failed"));
        });

        razorpayInstance.open();
      });

      const verifyResponse = await apiClient.post("/verify-payment", {
        orderId,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });

      if (!verifyResponse?.success) {
        throw new Error("Payment verification failed");
      }

      updateOrderPaymentDetails(orderId, {
        paymentStatus: verifyResponse?.data?.paymentStatus || "Paid",
        transactionId: verifyResponse?.data?.transactionId || paymentResponse?.razorpay_payment_id || "",
        razorpayOrderId: verifyResponse?.data?.razorpayOrderId || paymentResponse?.razorpay_order_id || "",
      });

      setIsProcessingPayment(false);
      finalizeSuccessFlow();
    } catch (error) {
      setIsProcessingPayment(false);
      setPaymentStep("payment");
      alert(error?.message || "Payment could not be completed. Please try again.");
    }
  };

  const finalTotal = grandTotal + deliveryCharge;

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
                {cart.map((item, index) => {
                  const itemSubtotal = Number(item.price || 0) * Number(item.quantity || 1);
                  const itemGstPercent = Number(item.gstPercent || 0);
                  const itemGstAmount = (itemSubtotal * itemGstPercent) / 100;
                  const itemTotal = itemSubtotal + itemGstAmount;

                  return (
                    <div key={index} className="summary-item">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">x{item.quantity}</span>
                      <span className="item-price">₹{itemTotal.toFixed(2)}</span>
                      <span className="item-price">GST {itemGstPercent}% (₹{itemGstAmount.toFixed(2)})</span>
                    </div>
                  );
                })}
              </div>
              <div className="summary-divider"></div>
              
              <div className="summary-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal:</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="breakdown-row">
                  <span>Total GST:</span>
                  <span>₹{totalGst.toFixed(2)}</span>
                </div>
                <div className="breakdown-row">
                  <span>Total after GST:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                {deliveryCharge > 0 && (
                  <div className="breakdown-row">
                    <span>Delivery Charge:</span>
                    <span>₹{deliveryCharge.toFixed(2)}</span>
                  </div>
                )}
                {deliveryCharge === 0 && (
                  <div className="breakdown-row discount">
                    <span>🎉 Free Delivery!</span>
                    <span className="free-badge">₹0</span>
                  </div>
                )}
              </div>

              <div className="summary-divider"></div>
              <div className="summary-total">
                <span>Final Payable Amount:</span>
                <span className="total-price">₹{finalTotal.toFixed(2)}</span>
              </div>
              
              {deliveryInfo && (
                <div className="delivery-estimate">
                  ⏱️ Estimated Delivery: {deliveryInfo.estimatedDeliveryText}
                  <br />
                  📅 Expected: {formatDateTime(deliveryInfo.estimatedDeliveryAt)}
                  {deliveryInfo.nextDayDelivery ? " (Next day schedule)" : ""}
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
              
              {/* Customer Name */}
              <div className="form-section">
                <h4>Your Details</h4>
                
                <div className="form-group">
                  <label htmlFor="customerName">
                    <span className="form-icon">👤</span>
                    Full Name *
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    name="customerName"
                    placeholder="Enter your full name"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
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
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                    />
                    <div className="pincode-check-wrap">
                      <button type="button" className="btn-back" onClick={handleCheckPincode}>
                        Check Availability
                      </button>
                      {pincodeStatus.checked && (
                        <span className={pincodeStatus.isValid ? "pincode-message success" : "pincode-message error"}>
                          {pincodeStatus.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="shopName">
                      <span className="form-icon">🏪</span>
                      Shop Name *
                    </label>
                    <input
                      id="shopName"
                      type="text"
                      name="shopName"
                      placeholder="Enter shop name"
                      value={formData.shopName}
                      onChange={handleInputChange}
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

              <button 
                type="submit" 
                className="btn-continue"
              >
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
                  <span className="payment-icon">💳</span>
                  <span className="payment-text">
                    <strong>Online Payment</strong>
                    <small>Pay with any Online app via Razorpay</small>
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

            {/* Online Payment */}
            {paymentMethod === "upi" && (
              <div className="payment-form upi-info">
                <h4>Online Payment</h4>
                <p>You will be redirected to Razorpay secure checkout.</p>
                <button type="button" onClick={handleProcessPayment} className="btn-confirm-payment" disabled={isProcessingPayment}>
                  {isProcessingPayment ? "Opening Razorpay..." : `Pay ₹${finalTotal.toFixed(2)}`}
                </button>
              </div>
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
            <h3>{paymentMethod === "cod" ? "Order Confirmed, Payment on Delivery." : "Payment Successful."}</h3>
            <p>
              {paymentMethod === "cod"
                ? "Your order has been confirmed. Please pay on delivery."
                : "Your order has been confirmed and payment is successful."}
            </p>
            <div className="success-details">
              <p><strong>Payment Method:</strong> {paymentMethod === "cod" ? "COD" : "Online Payment"}</p>
              <p><strong>Subtotal:</strong> ₹{totalPrice.toFixed(2)}</p>
              <p><strong>Total GST:</strong> ₹{totalGst.toFixed(2)}</p>
              <p><strong>Delivery Charge:</strong> ₹{deliveryCharge.toFixed(2)}</p>
              <p><strong>Total Amount Paid:</strong> ₹{finalTotal.toFixed(2)}</p>
              <p><strong>Status:</strong> <span className="status-badge confirmed">Confirmed</span></p>
              {deliveryInfo && (
                <p>
                  <strong>Est. Delivery:</strong> {deliveryInfo.estimatedDeliveryText} — {formatDateTime(deliveryInfo.estimatedDeliveryAt)}
                  {deliveryInfo.nextDayDelivery ? " (Next day schedule)" : ""}
                </p>
              )}
            </div>
            {lastInvoice && (
              <div className="success-details" style={{ marginTop: "1rem", textAlign: "left" }}>
                <p><strong>Invoice:</strong> {lastInvoice.invoiceNumber}</p>
                <p><strong>Shop Name:</strong> {lastInvoice.shopName}</p>
                <p><strong>Date & Time:</strong> {formatDateTime(lastInvoice.dateTime)}</p>
                {(lastInvoice.items || []).map((item, index) => (
                  <p key={`${item.name || "item"}-${index}`}>
                    {index + 1}. {item.name} | Qty {item.quantity} | Price ₹{item.price.toFixed(2)} | GST {item.gstPercent}% | GST Amt ₹{item.gstAmount.toFixed(2)} | Total ₹{item.total.toFixed(2)}
                  </p>
                ))}
                <p><strong>Total Amount before GST:</strong> ₹{lastInvoice.totalAmountBeforeGst.toFixed(2)}</p>
                <p><strong>Total GST:</strong> ₹{lastInvoice.totalGst.toFixed(2)}</p>
                <p><strong>Final Payable Amount:</strong> ₹{lastInvoice.finalPayableAmount.toFixed(2)}</p>
              </div>
            )}
            <p className="redirecting">Redirecting to order confirmation...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;
