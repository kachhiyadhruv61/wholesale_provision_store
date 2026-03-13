import { createContext, useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

export const OrderContext = createContext();

const MONGO_ID_REGEX = /^[a-f\d]{24}$/i;

const isMongoId = (value) => MONGO_ID_REGEX.test(String(value || ""));

const normalizeOrder = (order = {}) => {
  const mappedId = order.id || order._id || order.orderId || Date.now().toString();
  return {
    ...order,
    id: String(mappedId),
    _id: order._id || (isMongoId(mappedId) ? String(mappedId) : null),
    date: order.date || order.orderDate || order.createdAt || new Date().toISOString(),
    orderDate: order.orderDate || order.date || order.createdAt || new Date().toISOString(),
    items: Array.isArray(order.items) ? order.items : [],
    total: Number(order.total ?? order.totalAmount ?? 0),
    paymentMethod: order.paymentMethod || order.payment || "cod",
    paymentStatus: order.paymentStatus || "Pending",
    status: order.status || "Pending",
    customerId: order.customerId || order.userId || order.registerId || null,
    customerUsername: order.customerUsername || order.username || "",
    customerEmail: order.customerEmail || order.email || "",
    customerName: order.customerName || order.name || order.fullname || order?.delivery?.name || "",
    deliveryAddress: order.deliveryAddress || order?.delivery?.deliveryAddress || "",
    deliveryCity: order.deliveryCity || order.city || order?.delivery?.city || "",
    deliveryState: order.deliveryState || order.state || "",
    deliveryPincode: order.deliveryPincode || order?.delivery?.pincode || "",
    specialInstructions: order.specialInstructions || order?.delivery?.specialInstruction || "",
    statusUpdatedAt: order.statusUpdatedAt || order.updatedAt || order.createdAt || null,
    statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : [],
  };
};

const toBackendPayment = (method = "cod") => {
  const normalized = String(method || "cod").toLowerCase();
  if (normalized === "upi") return "UPI";
  if (normalized === "card") return "Card";
  if (normalized === "cash" || normalized === "cod") return "Cash";
  return "Cash";
};

const toBackendStatus = (status = "Pending") => {
  const normalized = String(status || "Pending").toLowerCase();
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  if (normalized === "confirmed") return "Confirmed";
  if (normalized === "processing") return "Processing";
  if (normalized === "delivered") return "Delivered";
  if (normalized === "completed") return "Completed";
  if (normalized === "shipped" || normalized === "out for delivery") return "Processing";
  return "Pending";
};

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      let localOrders = [];
      const savedOrders = localStorage.getItem("orders");
      if (savedOrders) {
        try {
          localOrders = JSON.parse(savedOrders).map(normalizeOrder);
        } catch {
          localOrders = [];
        }
      }

      if (isMounted) {
        setOrders(localOrders);
      }

      try {
        const response = await apiClient.get("/api/orders");
        const remoteOrders = Array.isArray(response?.data) ? response.data.map(normalizeOrder) : [];
        const merged = [...localOrders];

        remoteOrders.forEach((remoteOrder) => {
          const index = merged.findIndex((entry) => entry.id === remoteOrder.id);
          if (index === -1) {
            merged.unshift(remoteOrder);
            return;
          }
          const localOrder = merged[index];
          merged[index] = normalizeOrder({
            ...localOrder,
            ...remoteOrder,
            items: localOrder.items?.length ? localOrder.items : remoteOrder.items,
          });
        });

        if (isMounted) {
          setOrders(merged);
        }
      } catch {
        // Keep local fallback when API is unavailable.
      }

    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync orders live across tabs/windows
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== "orders") return;
      try {
        const parsed = event.newValue ? JSON.parse(event.newValue) : [];
        setOrders(Array.isArray(parsed) ? parsed.map(normalizeOrder) : []);
      } catch {
        setOrders([]);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const addOrder = async (order) => {
    const now = new Date().toISOString();
    const initialStatus = order.status || "Confirmed";
    const localId = Date.now().toString();
    const newOrder = normalizeOrder({
      id: localId,
      date: now,
      orderDate: now,
      items: order.items || [],
      total: order.total || 0,
      customerId: order.customerId || null,
      customerUsername: order.customerUsername || "",
      customerEmail: order.customerEmail || "",
      // Extended fields (optional, for richer display)
      paymentMethod: order.paymentMethod || "cod",
      paymentStatus: order.paymentStatus || "Pending",
      status: initialStatus,
      statusUpdatedAt: now,
      statusHistory: [
        {
          status: initialStatus,
          timestamp: now,
        },
      ],
      deliveryAddress: order.deliveryAddress || "",
      deliveryCity: order.deliveryCity || "",
      deliveryState: order.deliveryState || "",
      deliveryPincode: order.deliveryPincode || "",
      specialInstructions: order.specialInstructions || "",
      estimatedDeliveryAt: order.estimatedDeliveryAt || null,
    });

    setOrders((prev) => [newOrder, ...prev]);

    try {
      const backendDate = new Date(order.orderDate || now).toISOString();
      const backendStatus = toBackendStatus(order.status || "Pending");
      const response = await apiClient.post("/api/orders", {
        orderId: `ORD-${localId}`,
        userId: String(order.customerId || order.customerEmail || "guest"),
        date: backendDate,
        totalAmount: Number(order.total || 0),
        payment: toBackendPayment(order.paymentMethod),
        status: backendStatus,
        action: backendStatus === "Pending" ? "Pending" : "Processing",
        name: order.customerName || order.customerUsername || "Customer",
        email: order.customerEmail || "",
        deliveryAddress: order.deliveryAddress || "",
        city: order.deliveryCity || "",
        state: order.deliveryState || "",
        pincode: String(order.deliveryPincode || ""),
        specialInstruction: order.specialInstructions || "",
        items: (order.items || []).map((item) => ({
          id: item._id || item.id || "",
          name: item.name || "",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          image: item.image || "",
          category: item.category || "",
        })),
        subtotal: Number(order.subtotal || order.total || 0),
        deliveryCharge: Number(order.deliveryCharge || 0),
      });

      const insertedId = response?.insertedId?.toString?.() || response?.insertedId;
      if (insertedId) {
        const syncedOrder = normalizeOrder({ ...newOrder, id: insertedId, _id: insertedId });
        setOrders((prev) => prev.map((entry) => (entry.id === localId ? syncedOrder : entry)));
        return syncedOrder;
      }
    } catch {
      // Keep local order so checkout UX is not blocked if backend is down.
    }

    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const now = new Date().toISOString();
    const orderIdString = String(orderId);

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderIdString
          ? {
              ...order,
              status: newStatus,
              statusUpdatedAt: now,
              statusHistory: [
                ...(order.statusHistory || []),
                {
                  status: newStatus,
                  timestamp: now,
                },
              ],
            }
          : order
      )
    );

    if (!isMongoId(orderIdString)) {
      return { success: true };
    }

    try {
      await apiClient.put(`/api/orders/${encodeURIComponent(orderIdString)}`, {
        status: toBackendStatus(newStatus),
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Unable to update order status." };
    }
  };

  const updateOrderPaymentStatus = (orderId, newPaymentStatus) => {
    const orderIdString = String(orderId);
    const updatedOrders = orders.map((order) =>
      order.id === orderIdString ? { ...order, paymentStatus: newPaymentStatus } : order
    );
    setOrders(updatedOrders);
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, updateOrderPaymentStatus }}>
      {children}
    </OrderContext.Provider>
  );
}
