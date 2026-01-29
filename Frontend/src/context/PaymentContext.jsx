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
      // Initialize with sample payment data
      const samplePayments = [
        {
          id: "PAY001",
          orderId: "ORD450",
          transactionId: "TXN20260129001",
          customerName: "Rahul Patel",
          customerEmail: "rahul@example.com",
          customerPhone: "+91-9876543210",
          amount: 2450,
          method: "UPI",
          date: new Date(2026, 0, 29, 10, 30, 0).toISOString(),
          status: "Paid",
          products: ["Rice 25kg", "Wheat Flour"],
          totalAmount: 2450
        },
        {
          id: "PAY002",
          orderId: "ORD451",
          transactionId: "TXN20260128001",
          customerName: "Amit Kumar",
          customerEmail: "amit@example.com",
          customerPhone: "+91-9876543211",
          amount: 1200,
          method: "COD",
          date: new Date(2026, 0, 28, 14, 45, 0).toISOString(),
          status: "Pending",
          products: ["Basmati Rice 10kg"],
          totalAmount: 1200
        },
        {
          id: "PAY003",
          orderId: "ORD449",
          transactionId: "TXN20260127001",
          customerName: "Priya Singh",
          customerEmail: "priya@example.com",
          customerPhone: "+91-9876543212",
          amount: 3200,
          method: "Debit Card",
          date: new Date(2026, 0, 27, 11, 20, 0).toISOString(),
          status: "Paid",
          products: ["Masala Pack", "Oil 5L", "Spices Bundle"],
          totalAmount: 3200
        },
        {
          id: "PAY004",
          orderId: "ORD448",
          transactionId: "TXN20260126001",
          customerName: "Deepak Sharma",
          customerEmail: "deepak@example.com",
          customerPhone: "+91-9876543213",
          amount: 5100,
          method: "Net Banking",
          date: new Date(2026, 0, 26, 9, 15, 0).toISOString(),
          status: "Failed",
          products: ["Rice 50kg", "Wheat 25kg", "Lentils 10kg"],
          totalAmount: 5100
        },
        {
          id: "PAY005",
          orderId: "ORD447",
          transactionId: "TXN20260125001",
          customerName: "Neha Verma",
          customerEmail: "neha@example.com",
          customerPhone: "+91-9876543214",
          amount: 1800,
          method: "Credit Card",
          date: new Date(2026, 0, 25, 16, 30, 0).toISOString(),
          status: "Refunded",
          products: ["Snacks Bundle"],
          totalAmount: 1800
        }
      ];
      setPayments(samplePayments);
      localStorage.setItem("payments", JSON.stringify(samplePayments));
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
