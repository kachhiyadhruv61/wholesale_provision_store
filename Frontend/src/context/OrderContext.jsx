import { createContext, useState, useEffect } from "react";

export const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch {
        setOrders([]);
      }
    }
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

  const addOrder = (order) => {
    const now = new Date().toISOString();
    const initialStatus = order.status || "Confirmed";
    const newOrder = {
      id: Date.now(),
      date: now,
      items: order.items || [],
      total: order.total || 0,
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
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const now = new Date().toISOString();
    const updatedOrders = orders.map(order =>
      order.id === orderId
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
    );
    setOrders(updatedOrders);
  };

  const updateOrderPaymentStatus = (orderId, newPaymentStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
    );
    setOrders(updatedOrders);
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, updateOrderPaymentStatus }}>
      {children}
    </OrderContext.Provider>
  );
}
