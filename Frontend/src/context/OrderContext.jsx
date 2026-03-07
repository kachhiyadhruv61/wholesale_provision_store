import { createContext, useState, useEffect } from "react";
import { apiRequest, getResponseList, normalizeMongoId } from "../utils/api";

export const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  const mapOrderRecord = (record) => {
    const item = normalizeMongoId(record);
    const createdAt = item.orderDate || item.date || item.createdAt || new Date().toISOString();
    const total = Number(item.total || item.totalAmount || 0);
    const paymentMethod = item.paymentMethod || item.payment || "cod";
    const status = item.status || "Pending";

    return {
      ...item,
      id: item.id,
      date: createdAt,
      orderDate: createdAt,
      total,
      totalAmount: total,
      paymentMethod,
      paymentStatus: item.paymentStatus || "Pending",
      status,
      statusUpdatedAt: item.statusUpdatedAt || createdAt,
      statusHistory:
        Array.isArray(item.statusHistory) && item.statusHistory.length > 0
          ? item.statusHistory
          : [{ status, timestamp: createdAt }],
      items: Array.isArray(item.items) ? item.items : [],
    };
  };

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const payload = await apiRequest("/orders");
        const rows = getResponseList(payload);
        setOrders(rows.map(mapOrderRecord));
        return;
      } catch (error) {
        console.error("Failed to fetch orders from API", error);
      }

      const savedOrders = localStorage.getItem("orders");
      if (!savedOrders) {
        setOrders([]);
        return;
      }

      try {
        setOrders(JSON.parse(savedOrders));
      } catch {
        setOrders([]);
      }
    };

    loadOrders();
  }, []);

  // Sync orders live across tabs/windows
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== "orders") return;
      try {
        setOrders(event.newValue ? JSON.parse(event.newValue) : []);
      } catch {
        setOrders([]);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save orders to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
    
  }, [orders]);

  const addOrder = async (order) => {
    const now = new Date().toISOString();
    const initialStatus = order.status || "Pending";
    const newOrder = {
      id: order.id || Date.now().toString(),
      date: now,
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
    };

    const orderPayload = {
      ...newOrder,
      orderId: `ORD-${Date.now()}`,
      userId: (order.customerId || "guest").toString(),
      date: now.slice(0, 10),
      totalAmount: Number(newOrder.total || 0),
      payment: (newOrder.paymentMethod || "cod").toString().toUpperCase(),
      status: initialStatus,
      action: "Processing",
    };

    try {
      const payload = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      const createdId = payload?.insertedId || newOrder.id;
      const created = mapOrderRecord({ ...newOrder, id: createdId, _id: createdId });
      setOrders((prev) => [created, ...prev]);
      return created;
    } catch (error) {
      console.error("Failed to create order via API", error);
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const now = new Date().toISOString();
    const targetId = orderId?.toString?.() || orderId;

    try {
      await apiRequest(`/orders/${encodeURIComponent(targetId)}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Failed to update order status via API", error);
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id?.toString() === targetId
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
  };

  const updateOrderPaymentStatus = async (orderId, newPaymentStatus) => {
    const targetId = orderId?.toString?.() || orderId;

    try {
      await apiRequest(`/orders/${encodeURIComponent(targetId)}`, {
        method: "PUT",
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
    } catch (error) {
      console.error("Failed to update order payment status via API", error);
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id?.toString() === targetId ? { ...order, paymentStatus: newPaymentStatus } : order
      )
    );
  };

  // Get single order by ID
  const getOrderById = async (orderId) => {
    const targetId = orderId?.toString?.() || orderId;
    try {
      const payload = await apiRequest(`/orders/${encodeURIComponent(targetId)}`);
      return { success: true, data: mapOrderRecord(payload?.data || payload) };
    } catch (error) {
      console.error("Failed to get order by ID", error);
      return { success: false, message: error.message };
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    const targetId = orderId?.toString?.() || orderId;
    try {
      await apiRequest(`/orders/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      setOrders((prev) => prev.filter((o) => o.id?.toString() !== targetId));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete order", error);
      return { success: false, message: error.message };
    }
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      addOrder, 
      updateOrderStatus, 
      updateOrderPaymentStatus,
      getOrderById,
      deleteOrder
    }}>
      {children}
    </OrderContext.Provider>
  );
}
