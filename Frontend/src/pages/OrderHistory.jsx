import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { OrderContext } from "../context/OrderContext";

function OrderHistory() {
  const { orders } = useContext(OrderContext);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const methodLabel = (m) => {
    switch ((m || "cod").toLowerCase()) {
      case "upi":
        return "📱 UPI";
      case "card":
        return "💳 Card";
      case "bank":
        return "🏦 Bank";
      default:
        return "🚚 COD";
    }
  };

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div className="orders-title">
          <span className="orders-icon">🧾</span>
          <h2>Order History</h2>
        </div>
        <p className="orders-subtitle">
          Track your orders, payment methods, and totals at a glance.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <div className="empty-illustration">📦</div>
          <h3>No orders yet</h3>
          <p>Start shopping and place your first wholesale order.</p>
          <button className="btn-primary" onClick={() => navigate("/products")}>
            Browse Products →
          </button>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <div className="order-id">#{order.id}</div>
                <div className="order-date">{formatDate(order.date)}</div>
              </div>

              <div className="order-meta">
                <span className={`status-badge ${String(order.status || "Confirmed").toLowerCase()}`}>
                  {order.status || "Confirmed"}
                </span>
                <span className="method-badge">{methodLabel(order.paymentMethod)}</span>
              </div>

              <div className="order-items">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={index} className="order-item-row">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">₹{item.price}</span>
                    </div>
                  ))
                ) : (
                  <div className="order-item-row muted">No items to display</div>
                )}
              </div>

              {(order.deliveryAddress || order.deliveryCity) && (
                <div className="order-delivery">
                  <span className="delivery-icon">📍</span>
                  <span className="delivery-text">
                    {order.deliveryAddress}
                    {order.deliveryCity ? `, ${order.deliveryCity}` : ""}
                    {order.deliveryState ? `, ${order.deliveryState}` : ""}
                    {order.deliveryPincode ? ` - ${order.deliveryPincode}` : ""}
                  </span>
                </div>
              )}

              <div className="order-card-footer">
                <div className="order-total">
                  <span>Total</span>
                  <span className="total-amount">₹{Number(order.total || 0).toFixed(2)}</span>
                </div>
                <div className="order-actions">
                  <button className="btn-secondary" onClick={() => navigate("/products")}>
                    Reorder
                  </button>
                  <button className="btn-primary" onClick={() => navigate("/checkout")}>
                    Checkout Again
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
