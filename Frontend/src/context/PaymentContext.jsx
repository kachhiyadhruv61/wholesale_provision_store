import { createContext, useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

export const PaymentContext = createContext();

const normalizePayment = (payment = {}) => ({
  ...payment,
  id: String(payment.id || payment._id || `PAY${Date.now()}`),
  orderId: payment.orderId || "",
  transactionId: payment.transactionId || "",
  customerName: payment.customerName || "",
  customerEmail: payment.customerEmail || "",
  customerPhone: payment.customerPhone || "",
  amount: Number(payment.amount || payment.totalAmount || 0),
  method: payment.method || payment.paymentMethod || "COD",
  status: payment.status || "Pending",
  date: payment.date || payment.createdAt || new Date().toISOString(),
  products: Array.isArray(payment.products) ? payment.products : [],
  totalAmount: Number(payment.totalAmount || payment.amount || 0),
});

const toBackendMethod = (method = "COD") => {
  const normalized = String(method || "COD").toLowerCase();
  if (normalized === "upi") return "UPI";
  if (normalized === "card") return "Card";
  return "Cash";
};

const toBackendStatus = (status = "Pending") => {
  const normalized = String(status || "Pending").toLowerCase();
  if (normalized === "completed" || normalized === "paid") return "Completed";
  if (normalized === "failed") return "Failed";
  return "Pending";
};

export function PaymentProvider({ children }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadPayments = async () => {
      let localPayments = [];
      const savedPayments = localStorage.getItem("payments");
      if (savedPayments) {
        try {
          const parsed = JSON.parse(savedPayments);
          localPayments = Array.isArray(parsed) ? parsed.map(normalizePayment) : [];
        } catch {
          localPayments = [];
        }
      }

      if (isMounted) {
        setPayments(localPayments);
      }

      try {
        const response = await apiClient.get("/api/payments");
        const remotePayments = Array.isArray(response?.data) ? response.data.map(normalizePayment) : [];
        const merged = [...localPayments];

        remotePayments.forEach((remotePayment) => {
          const idx = merged.findIndex((entry) => entry.id === remotePayment.id);
          if (idx === -1) {
            merged.unshift(remotePayment);
            return;
          }
          merged[idx] = normalizePayment({ ...merged[idx], ...remotePayment });
        });

        if (isMounted) {
          setPayments(merged);
        }
      } catch {
        // Keep local fallback when API is unavailable.
      }
    };

    loadPayments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("payments", JSON.stringify(payments));
  }, [payments]);

  const addPayment = async (payment) => {
    const now = new Date().toISOString();
    const localId = `PAY${Date.now()}`;
    const newPayment = normalizePayment({
      id: localId,
      date: now,
      status: payment.status || "Pending",
      orderId: payment.orderId || "",
      transactionId: payment.transactionId || "",
      customerName: payment.customerName || "",
      customerEmail: payment.customerEmail || "",
      customerPhone: payment.customerPhone || "",
      amount: payment.amount || 0,
      method: payment.method || "COD",
      products: payment.products || [],
      totalAmount: payment.totalAmount || payment.amount || 0
    });

    setPayments((prev) => [newPayment, ...prev]);

    try {
      const response = await apiClient.post("/api/payments", {
        orderId: newPayment.orderId,
        amount: Number(newPayment.amount || 0),
        method: toBackendMethod(newPayment.method),
        paymentMethod: toBackendMethod(newPayment.method),
        status: toBackendStatus(newPayment.status),
        date: now.slice(0, 10),
      });

      const insertedId = response?.insertedId?.toString?.() || response?.insertedId;
      if (insertedId) {
        const syncedPayment = normalizePayment({ ...newPayment, id: insertedId, _id: insertedId });
        setPayments((prev) => prev.map((entry) => (entry.id === localId ? syncedPayment : entry)));
      }
    } catch {
      // Keep local payment if backend request fails.
    }

    return newPayment;
  };

  const updatePaymentStatus = (paymentId, newStatus) => {
    const paymentIdString = String(paymentId);
    setPayments((prev) =>
      prev.map((payment) =>
        String(payment.id) === paymentIdString ? { ...payment, status: newStatus } : payment
      )
    );
  };

  return (
    <PaymentContext.Provider value={{ payments, addPayment, updatePaymentStatus }}>
      {children}
    </PaymentContext.Provider>
  );
}
