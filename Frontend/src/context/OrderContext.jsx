import { createContext, useState, useEffect } from "react";

export const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  // Save orders to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const addOrder = (order) => {
    const now = new Date().toISOString();
    const newOrder = {
      id: Date.now(),
      date: now,
      items: order.items || [],
      total: order.total || 0,
      // Extended fields (optional, for richer display)
      paymentMethod: order.paymentMethod || "cod",
      paymentStatus: order.paymentStatus || "Pending",
      status: order.status || "Confirmed",
      deliveryAddress: order.deliveryAddress || "",
      deliveryCity: order.deliveryCity || "",
      deliveryState: order.deliveryState || "",
      deliveryPincode: order.deliveryPincode || "",
      specialInstructions: order.specialInstructions || "",
    };
    setOrders([newOrder, ...orders]);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
}
