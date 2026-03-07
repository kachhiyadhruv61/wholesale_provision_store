import { createContext, useState, useEffect } from "react";
import { apiRequest, getResponseList, normalizeMongoId } from "../utils/api";

export const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const [payments, setPayments] = useState([]);

  const mapPaymentRecord = (record) => {
    const item = normalizeMongoId(record);
    const amount = Number(item.amount || item.totalAmount || 0);
    const date = item.date || item.createdAt || new Date().toISOString();

    return {
      ...item,
      id: item.id,
      date,
      status: item.status || "Pending",
      amount,
      totalAmount: Number(item.totalAmount || amount),
      method: item.method || "COD",
      products: Array.isArray(item.products) ? item.products : [],
    };
  };

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const payload = await apiRequest("/payments");
        const rows = getResponseList(payload);
        setPayments(rows.map(mapPaymentRecord));
        return;
      } catch (error) {
        console.error("Failed to fetch payments from API", error);
      }

      const savedPayments = localStorage.getItem("payments");
      if (savedPayments) {
        try {
          setPayments(JSON.parse(savedPayments));
          return;
        } catch (error) {
          console.error("Failed to parse saved payments", error);
        }
      }

      setPayments([]);
      localStorage.setItem("payments", JSON.stringify([]));
    };

    loadPayments();
  }, []);

  // Save payments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("payments", JSON.stringify(payments));
  }, [payments]);

  const addPayment = async (payment) => {
    const now = new Date().toISOString();
    const newPayment = {
      id: payment.id || `PAY${Date.now()}`,
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
    };

    try {
      const payload = await apiRequest("/payments", {
        method: "POST",
        body: JSON.stringify({
          ...newPayment,
          amount: Number(newPayment.amount || 0),
          status: newPayment.status,
          method: newPayment.method,
          date: now.slice(0, 10),
        }),
      });

      const createdId = payload?.insertedId || newPayment.id;
      const created = mapPaymentRecord({ ...newPayment, id: createdId, _id: createdId });
      setPayments((prev) => [created, ...prev]);
      return { success: true, data: created };
    } catch (error) {
      console.error("Failed to add payment via API", error);
      setPayments((prev) => [newPayment, ...prev]);
      return { success: false, message: error.message };
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    const targetId = paymentId?.toString?.() || paymentId;

    try {
      await apiRequest(`/payments/${encodeURIComponent(targetId)}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Failed to update payment status via API", error);
    }

    setPayments((prev) =>
      prev.map((payment) =>
        payment.id?.toString() === targetId ? { ...payment, status: newStatus } : payment
      )
    );
  };

  // Get single payment by ID
  const getPaymentById = async (paymentId) => {
    const targetId = paymentId?.toString?.() || paymentId;
    try {
      const payload = await apiRequest(`/payments/${encodeURIComponent(targetId)}`);
      return { success: true, data: mapPaymentRecord(payload?.data || payload) };
    } catch (error) {
      console.error("Failed to get payment by ID", error);
      return { success: false, message: error.message };
    }
  };

  // Delete payment
  const deletePayment = async (paymentId) => {
    const targetId = paymentId?.toString?.() || paymentId;
    try {
      await apiRequest(`/payments/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      setPayments((prev) => prev.filter((p) => p.id?.toString() !== targetId));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete payment", error);
      return { success: false, message: error.message };
    }
  };

  return (
    <PaymentContext.Provider value={{ 
      payments, 
      addPayment, 
      updatePaymentStatus,
      getPaymentById,
      deletePayment
    }}>
      {children}
    </PaymentContext.Provider>
  );
}
