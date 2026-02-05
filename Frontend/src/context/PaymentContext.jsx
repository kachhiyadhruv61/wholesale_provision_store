import { createContext, useState, useEffect } from "react";

export const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const [payments, setPayments] = useState([]);

  // Load payments from localStorage on mount
  useEffect(() => {
    const savedPayments = localStorage.getItem("payments");
    if (savedPayments) {
      setPayments(JSON.parse(savedPayments));
    } else {
      setPayments([]);
      localStorage.setItem("payments", JSON.stringify([]));
    }
  }, []);

  // Save payments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("payments", JSON.stringify(payments));
  }, [payments]);

  const addPayment = (payment) => {
    const now = new Date().toISOString();
    const newPayment = {
      id: `PAY${Date.now()}`,
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
    setPayments([newPayment, ...payments]);
  };

  const updatePaymentStatus = (paymentId, newStatus) => {
    const updatedPayments = payments.map(payment =>
      payment.id === paymentId ? { ...payment, status: newStatus } : payment
    );
    setPayments(updatedPayments);
  };

  return (
    <PaymentContext.Provider value={{ payments, addPayment, updatePaymentStatus }}>
      {children}
    </PaymentContext.Provider>
  );
}
