import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrderContext } from "../context/OrderContext";
import { UserContext } from "../context/UserContext";
import CommonTable from "../components/CommonTable";

function OrderHistory() {
  const { orders } = useContext(OrderContext);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

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

  const paymentMethodText = (method) => {
    switch ((method || "cod").toLowerCase()) {
      case "upi":
        return "UPI";
      case "card":
        return "Card";
      case "bank":
        return "Net Banking";
      default:
        return "Cash on Delivery";
    }
  };

  const orderItemsColumns = useMemo(() => [
    { accessorKey: "name", header: "Product" },
    { accessorKey: "quantity", header: "Quantity" },
    {
      accessorKey: "price",
      header: "Price",
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`
    },
    {
      accessorKey: "total",
      header: "Total",
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`
    }
  ], []);

  const orderItemsData = useMemo(
    () => (selectedOrder?.items || []).map(item => ({
      name: item.name || "Product",
      quantity: item.quantity || 0,
      price: item.price || 0,
      total: (item.quantity || 0) * (item.price || 0)
    })),
    [selectedOrder]
  );

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const visibleOrders = useMemo(() => {
    if (!user) return [];
    return orders.filter((order) => {
      if (order.customerId && user.id && order.customerId === user.id) return true;
      if (order.customerUsername && user.username && order.customerUsername === user.username) return true;
      if (order.customerEmail && user.email && order.customerEmail === user.email) return true;
      return false;
    });
  }, [orders, user]);

  const ordersTableData = useMemo(
    () => visibleOrders.map((order) => ({
      id: `#${order.id}`,
      date: formatDate(order.date),
      status: order.status || "Confirmed",
      paymentMethod: methodLabel(order.paymentMethod),
      itemCount: order.items?.length || 0,
      total: Number(order.total || 0),
      actionsLabel: "Actions",
      rawOrder: order,
    })),
    [visibleOrders]
  );

  const ordersColumns = useMemo(
    () => [
      { accessorKey: "id", header: "Order ID" },
      { accessorKey: "date", header: "Date" },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ cell }) => {
          const status = cell.getValue() || "Confirmed";
          return <span className={`status-badge ${String(status).toLowerCase()}`}>{status}</span>;
        },
      },
      { accessorKey: "paymentMethod", header: "Payment" },
      { accessorKey: "itemCount", header: "Items" },
      {
        accessorKey: "total",
        header: "Total",
        Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`,
      },
      {
        accessorKey: "actionsLabel",
        header: "Actions",
        Cell: ({ row }) => (
          <div className="order-actions">
            <button className="btn-secondary" onClick={() => handleViewOrder(row.original.rawOrder)}>
              View Details
            </button>
           
          </div>
        ),
      },
    ],
    [navigate]
  );

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

      {visibleOrders.length === 0 ? (
        <div className="orders-empty">
          <div className="empty-illustration">📦</div>
          <h3>No orders yet</h3>
          <p>Start shopping and place your first wholesale order.</p>
          <button className="btn-primary" onClick={() => navigate("/products")}>
            Browse Products →
          </button>
        </div>
      ) : (
        <div className="orders-table">
          <CommonTable
            columns={ordersColumns}
            data={ordersTableData}
            fileName="my-orders"
            showSelection={false}
          />
        </div>
      )}

      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - #{selectedOrder.id}</h2>
              <button
                className="modal-close"
                onClick={() => setShowOrderModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="order-detail-section">
                <h3>Order Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Order ID:</span>
                    <span className="value">#{selectedOrder.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(selectedOrder.date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Customer:</span>
                    <span className="value">{selectedOrder.customerName || "Customer"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className="value">{selectedOrder.status || "Confirmed"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Payment Method:</span>
                    <span className="value">{paymentMethodText(selectedOrder.paymentMethod)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Payment Status:</span>
                    <span className="value">{selectedOrder.paymentStatus || "Pending"}</span>
                  </div>
                </div>
              </div>

              <div className="order-detail-section">
                <h3>Delivery Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Address:</span>
                    <span className="value">{selectedOrder.deliveryAddress || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">City:</span>
                    <span className="value">{selectedOrder.deliveryCity || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">State:</span>
                    <span className="value">{selectedOrder.deliveryState || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Pincode:</span>
                    <span className="value">{selectedOrder.deliveryPincode || "N/A"}</span>
                  </div>
                </div>
                {selectedOrder.specialInstructions && (
                  <div className="special-instructions">
                    <strong>Special Instructions:</strong>
                    <p>{selectedOrder.specialInstructions}</p>
                  </div>
                )}
              </div>

              <div className="order-detail-section">
                <h3>Order Items</h3>
                <div className="items-table">
                  <CommonTable
                    columns={orderItemsColumns}
                    data={orderItemsData}
                    fileName={`my-order-${selectedOrder.id}-items`}
                    showSelection={false}
                  />
                </div>
              </div>

              <div className="order-detail-section order-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Charges:</span>
                  <span>₹0</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>₹{(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-close"
                onClick={() => setShowOrderModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
