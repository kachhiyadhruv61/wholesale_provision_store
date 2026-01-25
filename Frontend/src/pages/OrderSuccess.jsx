import { useNavigate } from "react-router-dom";

function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h2>Order Placed Successfully</h2>
        <p className="success-subtitle">
          Thank you for your order! We’re preparing it for delivery.
        </p>

        <div className="success-actions">
          <button className="btn-primary" onClick={() => navigate("/order-history")}>View Orders</button>
          <button className="btn-secondary" onClick={() => navigate("/products")}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;