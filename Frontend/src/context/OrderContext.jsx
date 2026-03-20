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
    subtotalBeforeGst: Number(order.subtotalBeforeGst ?? order.totalAmountBeforeGst ?? order.subtotal ?? 0),
    totalGst: Number(order.totalGst ?? 0),
    subtotalAfterGst: Number(order.subtotalAfterGst ?? order.totalBeforeDelivery ?? order.total ?? order.totalAmount ?? 0),
    finalPayableAmount: Number(order.finalPayableAmount ?? order.total ?? order.totalAmount ?? 0),
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
    deliveryDistanceKm: Number(order.deliveryDistanceKm ?? order?.deliveryInfo?.distanceKm ?? 0),
    estimatedDeliveryHours: Number(order.estimatedDeliveryHours ?? order?.deliveryInfo?.estimatedDeliveryHours ?? 0),
    estimatedDeliveryAt: order.estimatedDeliveryAt || order?.deliveryInfo?.estimatedDeliveryAt || null,
    nextDayDelivery: Boolean(order.nextDayDelivery ?? order?.deliveryInfo?.nextDayDelivery),
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
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const extractOrdersArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.orders)) return payload.orders;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
  };

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      if (isMounted) {
        setOrdersLoading(true);
        setOrdersError("");
      }

      try {
        const response = await apiClient.get("/orders");
        const remoteOrders = extractOrdersArray(response).map(normalizeOrder);
        if (isMounted) {
          setOrders(remoteOrders);
          setOrdersError("");
        }

        return;
      } catch (error) {
        if (isMounted) {
          setOrders([]);
          setOrdersError(error?.message || "Unable to load orders from backend.");
        }
      } finally {
        if (isMounted) {
          setOrdersLoading(false);
        }
      }

    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const addOrder = async (order) => {
    const now = new Date().toISOString();

    try {
      const backendDate = new Date(order.orderDate || now).toISOString();
      const backendStatus = toBackendStatus(order.status || "Pending");
      const orderPayload = {
        orderId: `ORD-${Date.now()}`,
        userId: String(order.customerId || order.customerEmail || "guest"),
        date: backendDate,
        totalAmount: Number(order.total || 0),
        totalAmountBeforeGst: Number(order.subtotalBeforeGst || order.subtotal || 0),
        totalGst: Number(order.totalGst || 0),
        subtotalAfterGst: Number(order.subtotalAfterGst || order.total || 0),
        finalPayableAmount: Number(order.total || 0),
        payment: toBackendPayment(order.paymentMethod),
        status: backendStatus,
        action: backendStatus === "Pending" ? "Pending" : "Processing",
        name: order.customerName || order.customerUsername || "Customer",
        email: order.customerEmail || "",
        customerPhone: order.customerPhone || "",
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
          gstPercent: Number(item.gstPercent || 0),
          subtotal: Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 1)),
          gstAmount: Number(item.gstAmount || 0),
          total: Number(item.total || 0),
        })),
        subtotal: Number(order.subtotal || order.subtotalBeforeGst || order.total || 0),
        deliveryCharge: Number(order.deliveryCharge || 0),
      };

      console.log("POST /orders payload:", orderPayload);
      const response = await apiClient.post("/orders", orderPayload);

      if (response?.success === false) {
        return null;
      }

      const insertedId = response?.insertedId?.toString?.() || response?.insertedId;
      const savedOrder = normalizeOrder({
        ...(response?.data || {}),
        id: insertedId || response?.data?._id || response?.data?.id || Date.now().toString(),
        _id: response?.data?._id || insertedId || null,
      });

      setOrders((prev) => [savedOrder, ...prev]);
      return savedOrder;
    } catch {
      return null;
    }
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
      await apiClient.put(`/orders/${encodeURIComponent(orderIdString)}`, {
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
    <OrderContext.Provider value={{ orders, ordersLoading, ordersError, addOrder, updateOrderStatus, updateOrderPaymentStatus }}>
      {children}
    </OrderContext.Provider>
  );
}
