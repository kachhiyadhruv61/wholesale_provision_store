import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrderContext } from "../context/OrderContext";
import CommonTable from "../components/CommonTable";

function OrderHistory() {
  const { orders } = useContext(OrderContext);
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

  const trackingSteps = ["Pending", "Confirmed", "Processing", "Out for Delivery", "Delivered"];

  const normalizeStatus = (status) => {
    const incoming = String(status || "Confirmed").toLowerCase();
    if (incoming === "out for delivery") return "Out for Delivery";
    if (incoming === "delivered") return "Delivered";
    if (incoming === "processing") return "Processing";
    if (incoming === "pending") return "Pending";
    if (incoming === "cancelled") return "Cancelled";
    return "Confirmed";
  };

  const getStatusProgress = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "Cancelled") {
      return {
        currentStatus: normalized,
        stepIndex: -1,
      };
    }

    return {
      currentStatus: normalized,
      stepIndex: trackingSteps.findIndex((s) => s === normalized),
    };
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

  useEffect(() => {
    if (!selectedOrder?.id) return;
    const latestOrder = orders.find((order) => order.id === selectedOrder.id);
    if (latestOrder && latestOrder !== selectedOrder) {
      setSelectedOrder(latestOrder);
    }
  }, [orders, selectedOrder]);

  const ordersTableData = useMemo(
    () => orders.map((order) => ({
      id: `#${order.id}`,
      date: formatDate(order.date),
      status: order.status || "Confirmed",
      paymentMethod: methodLabel(order.paymentMethod),
      itemCount: order.items?.length || 0,
      total: Number(order.total || 0),
      actionsLabel: "Actions",
      rawOrder: order,
    })),
    [orders]
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
        (() => {
          const progress = getStatusProgress(selectedOrder.status);
          return (
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
                <h3>Live Tracking</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Current Status:</span>
                    <span className="value">{progress.currentStatus}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Last Updated:</span>
                    <span className="value">
                      {formatDate(selectedOrder.statusUpdatedAt || selectedOrder.date)}
                    </span>
                  </div>
                </div>

                {progress.currentStatus === "Cancelled" ? (
                  <p>❌ This order has been cancelled.</p>
                ) : (
                  <div className="detail-grid">
                    {trackingSteps.map((step, index) => (
                      <div className="detail-item" key={step}>
                        <span className="label">{index <= progress.stepIndex ? "✅" : "⏳"}</span>
                        <span className="value">{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
          );
        })()
      )}
    </div>
  );
}

export default OrderHistory;
