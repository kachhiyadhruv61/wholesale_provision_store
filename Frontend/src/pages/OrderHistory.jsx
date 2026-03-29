import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { OrderContext } from "../context/OrderContext";
import { UserContext } from "../context/UserContext";
import CommonTable from "../components/CommonTable";
import { calculateDeliveryEta } from "../utils/deliveryEta";

function OrderHistory() {
  const { orders, cancelOrder } = useContext(OrderContext);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelInProgress, setCancelInProgress] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resolveExpectedDeliveryAt = (order) => {
    const direct = order?.estimatedDeliveryAt || order?.deliveryInfo?.estimatedDeliveryAt;
    if (direct) return direct;

    const base = order?.orderDate || order?.date;
    if (!base) return null;

    const baseDate = new Date(base);
    if (Number.isNaN(baseDate.getTime())) return null;

    // Fallback rule: delivery ETA = 4 hours from order time during business window.
    // If order is outside business window, ETA starts from next business day window.
    return calculateDeliveryEta({ distanceKm: 0, orderDate: baseDate }).estimatedDeliveryAt;
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

  const trackingSteps = ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"];

  const normalizeStatus = (status) => {
    const incoming = String(status || "Confirmed").toLowerCase();
    if (incoming === "out for delivery") return "Out for Delivery";
    if (incoming === "delivered") return "Delivered";
    if (incoming === "shipped") return "Shipped";
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

  const isCancellableStatus = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    return normalized === "pending" || normalized === "confirmed";
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

  const openCancelModal = (order) => {
    if (!isCancellableStatus(order?.status)) {
      alert("Only Pending or Confirmed orders can be cancelled.");
      return;
    }
    setOrderToCancel(order);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    const reason = String(cancelReason || "").trim();
    if (!reason) {
      alert("Please enter cancellation reason.");
      return;
    }

    if (!orderToCancel?.id) {
      alert("Order not found for cancellation.");
      return;
    }

    setCancelInProgress(true);
    const result = await cancelOrder(orderToCancel.id, reason);
    setCancelInProgress(false);

    if (!result?.success) {
      alert(result?.message || "Unable to cancel order.");
      return;
    }

    if (selectedOrder?.id === orderToCancel.id) {
      setSelectedOrder(result?.data || { ...selectedOrder, status: "Cancelled", cancellationReason: reason });
    }

    setShowCancelModal(false);
    setOrderToCancel(null);
    setCancelReason("");

    const refundStatus = result?.refund?.status;
    if (refundStatus && String(refundStatus).toLowerCase() !== "not required") {
      alert(`Order cancelled successfully. Refund status: ${refundStatus}`);
      return;
    }

    alert("Order cancelled successfully.");
  };

  const loadImageDataUrl = (src) => new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = src;
  });

  const handleDownloadInvoice = async (order) => {
    const doc = new jsPDF();
    const logoDataUrl = await loadImageDataUrl(`${process.env.PUBLIC_URL || ""}/images/logos/3.png`);
    const orderDate = new Date(order?.date || new Date());
    const orderItems = Array.isArray(order?.items) ? order.items : [];

    const subtotal = orderItems.reduce(
      (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || 0),
      0
    );

    const totalGst =
      order?.totalGst != null
        ? Number(order.totalGst || 0)
        : orderItems.reduce((sum, item) => {
            const lineSubtotal = Number(item?.price || 0) * Number(item?.quantity || 0);
            if (item?.gstAmount != null) {
              return sum + Number(item.gstAmount || 0);
            }
            const gstPercent = Number(item?.gstPercent || 0);
            return sum + (lineSubtotal * gstPercent) / 100;
          }, 0);

    const subtotalAfterGst =
      order?.subtotalAfterGst != null
        ? Number(order.subtotalAfterGst || 0)
        : subtotal + totalGst;

    const deliveryCharge =
      order?.deliveryCharge != null
        ? Number(order.deliveryCharge || 0)
        : Math.max(Number(order?.total || order?.finalPayableAmount || 0) - subtotalAfterGst, 0);

    const grandTotal = Number(order?.finalPayableAmount || order?.total || subtotalAfterGst + deliveryCharge);

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", 14, 10, 16, 16);
    }

    doc.setFontSize(18);
    doc.text("DK TRADERS", logoDataUrl ? 34 : 14, 17);
    doc.setFontSize(11);
    doc.text("Wholesale Hub", logoDataUrl ? 34 : 14, 23);
    doc.setFontSize(14);
    doc.text("INVOICE", 160, 18);

    doc.setFontSize(11);
    doc.text(`Invoice No: INV-${order?.id || "NA"}`, 14, 32);
    doc.text(`Order ID: #${order?.id || "NA"}`, 14, 38);
    doc.text(`Date: ${orderDate.toLocaleString("en-IN")}`, 14, 44);

    doc.text(`Customer: ${order?.customerName || user?.username || "Customer"}`, 120, 32);
    doc.text(`Email: ${order?.customerEmail || user?.email || "N/A"}`, 120, 38);
    doc.text(`Payment: ${paymentMethodText(order?.paymentMethod)}`, 120, 44);
    doc.text(`Transaction ID: ${order?.transactionId || "N/A"}`, 120, 50);

    const tableRows = orderItems.map((item, index) => {
      const qty = Number(item?.quantity || 0);
      const price = Number(item?.price || 0);
      return [
        String(index + 1),
        item?.name || "Product",
        String(qty),
        `Rs ${price.toFixed(2)}`,
        `Rs ${(qty * price).toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: 58,
      head: [["#", "Item", "Qty", "Price", "Total"]],
      body: tableRows.length
        ? tableRows
        : [["-", "No items available", "0", "Rs 0.00", "Rs 0.00"]],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [67, 97, 238] },
    });

    const finalY = doc.lastAutoTable?.finalY || 70;
    doc.setFontSize(11);
    doc.text(`Subtotal: Rs ${subtotal.toFixed(2)}`, 140, finalY + 12);
    doc.text(`GST: Rs ${totalGst.toFixed(2)}`, 140, finalY + 18);
    doc.text(`Delivery Charge: Rs ${deliveryCharge.toFixed(2)}`, 140, finalY + 24);
    doc.setFontSize(12);
    doc.text(`Grand Total: Rs ${grandTotal.toFixed(2)}`, 140, finalY + 32);

    const fullAddress = [
      order?.deliveryAddress,
      order?.deliveryCity,
      order?.deliveryState,
      order?.deliveryPincode,
    ]
      .filter(Boolean)
      .join(", ");

    doc.setFontSize(10);
    doc.text(`Delivery Address: ${fullAddress || "N/A"}`, 14, finalY + 12);
    doc.text("Thank you for shopping with DK TRADERS.", 14, finalY + 24);

    doc.save(`invoice-${order?.id || Date.now()}.pdf`);
  };

  useEffect(() => {
    if (!selectedOrder?.id) return;
    const latestOrder = orders.find((order) => order.id === selectedOrder.id);
    if (latestOrder && latestOrder !== selectedOrder) {
      setSelectedOrder(latestOrder);
    }
  }, [orders, selectedOrder]);

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
            {isCancellableStatus(row.original.rawOrder?.status) && (
              <button className="btn-close" onClick={() => openCancelModal(row.original.rawOrder)}>
                Cancel Order
              </button>
            )}
            <button className="btn-success" onClick={() => handleDownloadInvoice(row.original.rawOrder)}>
              Download Invoice
            </button>
          </div>
        ),
      },
    ],
    [handleViewOrder, handleDownloadInvoice]
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
        (() => {
          const progress = getStatusProgress(selectedOrder.status);
          const expectedDeliveryAt = resolveExpectedDeliveryAt(selectedOrder);
          const selectedItems = Array.isArray(selectedOrder.items) ? selectedOrder.items : [];
          const summarySubtotal = selectedItems.reduce(
            (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || 0),
            0
          );
          const summaryGst =
            selectedOrder?.totalGst != null
              ? Number(selectedOrder.totalGst || 0)
              : selectedItems.reduce((sum, item) => {
                  const lineSubtotal = Number(item?.price || 0) * Number(item?.quantity || 0);
                  if (item?.gstAmount != null) {
                    return sum + Number(item.gstAmount || 0);
                  }
                  return sum + (lineSubtotal * Number(item?.gstPercent || 0)) / 100;
                }, 0);
          const summaryAfterGst =
            selectedOrder?.subtotalAfterGst != null
              ? Number(selectedOrder.subtotalAfterGst || 0)
              : summarySubtotal + summaryGst;
          const summaryDelivery =
            selectedOrder?.deliveryCharge != null
              ? Number(selectedOrder.deliveryCharge || 0)
              : Math.max(Number(selectedOrder?.total || selectedOrder?.finalPayableAmount || 0) - summaryAfterGst, 0);
          const summaryTotal = Number(
            selectedOrder?.finalPayableAmount || selectedOrder?.total || summaryAfterGst + summaryDelivery
          );

          const formatMoney = (value) =>
            Number(value || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

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
                <div className="live-tracking-summary">
                  <div>
                    <span className="label">Current Status:</span>
                    <span className={`tracking-status-chip status-${String(progress.currentStatus).toLowerCase().replace(/\s+/g, "-")}`}>
                      {progress.currentStatus}
                    </span>
                  </div>
                  <div>
                    <span className="label">Last Updated:</span>
                    <span className="value">
                      {formatDate(selectedOrder.statusUpdatedAt || selectedOrder.date)}
                    </span>
                  </div>
                  <div>
                    <span className="label">Expected Delivery:</span>
                    <span className="value">
                      {expectedDeliveryAt ? formatDate(expectedDeliveryAt) : "TBD"}
                    </span>
                  </div>
                </div>

                {progress.currentStatus === "Cancelled" ? (
                  <p className="tracking-cancelled">❌ This order has been cancelled.</p>
                ) : (
                  <div className="tracking-progress" role="list" aria-label="Order tracking progress">
                    {trackingSteps.map((step, index) => (
                      <div
                        className={`tracking-step ${index < progress.stepIndex ? "completed" : ""} ${
                          index === progress.stepIndex ? "current" : ""
                        }`}
                        key={step}
                        role="listitem"
                      >
                        <span className="tracking-step-circle" aria-hidden="true">
                          {index < progress.stepIndex ? "✓" : index + 1}
                        </span>
                        <span className="tracking-step-label">{step}</span>
                        <span className="tracking-step-meta">
                          {index < progress.stepIndex
                            ? "Completed"
                            : index === progress.stepIndex
                              ? "Current"
                              : "Pending"}
                        </span>
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
                    <span className="label">Transaction ID:</span>
                    <span className="value">{selectedOrder.transactionId || "N/A"}</span>
                  </div>
                  {selectedOrder.cancellationReason && (
                    <div className="detail-item">
                      <span className="label">Cancellation Reason:</span>
                      <span className="value">{selectedOrder.cancellationReason}</span>
                    </div>
                  )}
                  {selectedOrder.refund?.status && (
                    <div className="detail-item">
                      <span className="label">Refund Status:</span>
                      <span className="value">{selectedOrder.refund.status}</span>
                    </div>
                  )}
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
                  <div className="detail-item">
                    <span className="label">ETA Rule:</span>
                    <span className="value">
                      {selectedOrder.estimatedDeliveryHours
                        ? `${selectedOrder.estimatedDeliveryHours} hours (${selectedOrder.deliveryDistanceKm <= 10 ? "≤ 10km" : "> 10km"})`
                        : "N/A"}
                    </span>
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
                  <span>₹{formatMoney(summarySubtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>GST:</span>
                  <span>₹{formatMoney(summaryGst)}</span>
                </div>
                <div className="summary-row">
                  <span>Subtotal (After GST):</span>
                  <span>₹{formatMoney(summaryAfterGst)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Charges:</span>
                  <span>₹{formatMoney(summaryDelivery)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>₹{formatMoney(summaryTotal)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-success"
                onClick={() => handleDownloadInvoice(selectedOrder)}
              >
                Download Invoice
              </button>
              {isCancellableStatus(selectedOrder.status) && (
                <button
                  className="btn-close"
                  onClick={() => openCancelModal(selectedOrder)}
                >
                  Cancel Order
                </button>
              )}
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

      {showCancelModal && orderToCancel && (
        <div className="modal-overlay" onClick={() => !cancelInProgress && setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancel Order #{orderToCancel.id}</h2>
              <button
                className="modal-close"
                onClick={() => !cancelInProgress && setShowCancelModal(false)}
                disabled={cancelInProgress}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel this order?</p>
              <div className="form-group" style={{ marginTop: "12px" }}>
                <label htmlFor="cancel-reason"><strong>Cancellation Reason</strong></label>
                <textarea
                  id="cancel-reason"
                  rows={4}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancelling this order"
                  disabled={cancelInProgress}
                  style={{ width: "100%", marginTop: "8px" }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-close"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelInProgress}
              >
                Keep Order
              </button>
              <button
                className="btn-success"
                onClick={handleConfirmCancel}
                disabled={cancelInProgress}
              >
                {cancelInProgress ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
