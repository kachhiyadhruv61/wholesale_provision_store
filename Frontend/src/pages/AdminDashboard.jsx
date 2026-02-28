import { useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ProductContext } from "../context/ProductContext";
import { OrderContext } from "../context/OrderContext";
import { PaymentContext } from "../context/PaymentContext";
import { NotificationContext } from "../context/NotificationContext";
import CommonTable from "../components/CommonTable";

function AdminDashboard() {
  const { products, addProduct, updateProduct, deleteProduct, updateStock } = useContext(ProductContext);
  const { orders, updateOrderStatus, updateOrderPaymentStatus } = useContext(OrderContext);
  const { payments, addPayment, updatePaymentStatus } = useContext(PaymentContext);
  const { addNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("products");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceFormData, setPriceFormData] = useState({
    retailPrice: "",
    wholesalePrice: ""
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    orderId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    amount: "",
    method: "UPI",
    status: "Pending"
  });

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "Grains",
    price: "",
    wholesalePrice: "",
    purchaseCost: "",
    sellCost: "",
    stock: "",
    moq: "",
    unit: "bag",
    description: "",
    image: ""
  });
  const [imagePreview, setImagePreview] = useState(null);

  const displayCategory = (category) => (category === "Grains" ? "Grocery" : category);
  const categories = useMemo(() => {
    const unique = new Set(products.map(product => product.category || "Others"));
    unique.add("Grains");
    unique.add("Others");
    return Array.from(unique);
  }, [products]);
  const units = ["bag", "box", "bottle", "kg", "litre"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: "" }));
    setImagePreview(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "Grains",
      price: "",
      wholesalePrice: "",
      purchaseCost: "",
      sellCost: "",
      stock: "",
      moq: "",
      unit: "bag",
      description: "",
      image: ""
    });
    setImagePreview(null);
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const handleAddProduct = () => {
    if (!formData.name || !formData.price || !formData.wholesalePrice || !formData.purchaseCost || !formData.sellCost || !formData.stock) {
      alert("Please fill all required fields");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      wholesalePrice: Number(formData.wholesalePrice),
      purchaseCost: Number(formData.purchaseCost),
      sellCost: Number(formData.sellCost),
      stock: Number(formData.stock),
      moq: Number(formData.moq) || 1,
      unit: formData.unit,
      description: formData.description,
      image: formData.image || "",
      bulkPricing: [
        { quantity: 1, price: Number(formData.price) },
        { quantity: 5, price: Number(formData.price) * 0.95 },
        { quantity: 10, price: Number(formData.price) * 0.90 },
        { quantity: 20, price: Number(formData.wholesalePrice) }
      ]
    };

    addProduct(newProduct);
    alert("Product Added Successfully!");
    resetForm();
  };

  const handleUpdateProduct = () => {
    if (!formData.name || !formData.price || !formData.wholesalePrice || !formData.purchaseCost || !formData.sellCost || !formData.stock) {
      alert("Please fill all required fields");
      return;
    }

    const updatedProduct = {
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      wholesalePrice: Number(formData.wholesalePrice),
      purchaseCost: Number(formData.purchaseCost),
      sellCost: Number(formData.sellCost),
      stock: Number(formData.stock),
      moq: Number(formData.moq) || 1,
      unit: formData.unit,
      description: formData.description,
      image: formData.image || editingProduct.image || "",
      bulkPricing: [
        { quantity: 1, price: Number(formData.price) },
        { quantity: 5, price: Number(formData.price) * 0.95 },
        { quantity: 10, price: Number(formData.price) * 0.90 },
        { quantity: 20, price: Number(formData.wholesalePrice) }
      ]
    };

    updateProduct(editingProduct.id, updatedProduct);
    alert("Product Updated Successfully!");
    resetForm();
  };

  const handleEditClick = (product) => {
    setActiveTab("products");
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      wholesalePrice: product.wholesalePrice,
      purchaseCost: product.purchaseCost ?? product.wholesalePrice ?? product.price,
      sellCost: product.sellCost ?? product.price,
      stock: product.stock,
      moq: product.moq,
      unit: product.unit,
      description: product.description || "",
      image: product.image || ""
    });
    setImagePreview(product.image || null);
    setShowAddForm(true);
  };

  const handleDeleteProduct = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteProduct(id);
      alert("Product Deleted Successfully!");
    }
  };

  const handleStockUpdate = (product) => {
    const currentStock = Number(product.stock || 0);
    const stockInput = prompt(`Update stock for this product (Current: ${currentStock}):`, currentStock);
    if (stockInput === null) return;

    if (stockInput === "" || isNaN(stockInput)) {
      alert("Please enter a valid stock quantity.");
      return;
    }

    const parsedStock = Number(stockInput);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      alert("Stock cannot be negative.");
      return;
    }

    const previousAvgPurchase = Number(product.purchaseCost ?? product.wholesalePrice ?? product.price ?? 0);
    let nextAvgPurchase = previousAvgPurchase;

    if (parsedStock > currentStock) {
      const addedQty = parsedStock - currentStock;
      const purchaseInput = prompt(
        `Enter purchase price for newly added stock (${addedQty} units):`,
        String(previousAvgPurchase || "")
      );

      if (purchaseInput === null) return;
      if (purchaseInput === "" || isNaN(purchaseInput)) {
        alert("Please enter a valid purchase price.");
        return;
      }

      const newPurchasePrice = Number(purchaseInput);
      if (!Number.isFinite(newPurchasePrice) || newPurchasePrice < 0) {
        alert("Purchase price cannot be negative.");
        return;
      }

      if (currentStock <= 0) {
        nextAvgPurchase = newPurchasePrice;
      } else {
        const totalOldCost = previousAvgPurchase * currentStock;
        const totalNewCost = newPurchasePrice * addedQty;
        nextAvgPurchase = (totalOldCost + totalNewCost) / parsedStock;
      }
    }

    updateStock(product.id, parsedStock, { purchaseCost: Number(nextAvgPurchase.toFixed(2)) });

    if (currentStock >= 50 && parsedStock < 50) {
      addNotification({
        type: "stock",
        title: "Low stock alert",
        message: `${product?.name || "Item"} is low on stock (${parsedStock} left).`,
        meta: {
          product: product?.name,
          stock: parsedStock,
        },
      });
    }

    alert(`Stock updated successfully!\nAverage purchase price: ₹${nextAvgPurchase.toFixed(2)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/");
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.stock < 50);
  };

  const lowStockProducts = useMemo(() => getLowStockProducts(), [products]);


  const normalizePaymentStatus = (status) => {
    if (!status) return "Pending";
    if (status === "Completed") return "Paid";
    return status;
  };

  const normalizePaymentMethod = (method) => {
    if (!method) return "COD";
    const normalized = method.toLowerCase();
    if (normalized === "cod") return "COD";
    if (normalized === "upi") return "UPI";
    if (normalized === "card") return "Card";
    if (normalized === "bank") return "Net Banking";
    return method;
  };

  const paymentsFromOrders = useMemo(() => (
    orders.map(order => ({
      id: `PAY${order.id}`,
      orderId: order.id,
      orderNumericId: order.id,
      transactionId: order.transactionId || "",
      customerName: order.customerName || "Customer",
      customerEmail: order.customerEmail || "N/A",
      customerPhone: order.customerPhone || "N/A",
      amount: Number(order.total || 0),
      method: normalizePaymentMethod(order.paymentMethod),
      date: order.orderDate || order.date,
      status: normalizePaymentStatus(order.paymentStatus),
      products: order.items?.map(item => item.name) || [],
      totalAmount: Number(order.total || 0),
      source: "order"
    }))
  ), [orders]);

  const manualPayments = payments;

  const displayPayments = useMemo(() => {
    const orderIds = new Set(paymentsFromOrders.map(p => p.orderId?.toString()));
    const extraPayments = payments.filter(p => !orderIds.has(p.orderId?.toString()));
    return [...paymentsFromOrders, ...extraPayments];
  }, [paymentsFromOrders, payments]);

  const getTotalInventoryValue = () => {
    return products.reduce((total, p) => total + (p.price * p.stock), 0);
  };

  // Order Management Functions
  const getOrderStats = () => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "Pending").length;
    const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    return { totalOrders, pendingOrders, deliveredOrders, totalRevenue };
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      "Pending": "Pending",
      "Processing": "Processing",
      "Delivered": "Delivered",
      "Cancelled": "Cancelled"
    };
    return statusMap[status] || "Unknown";
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    if (updateOrderStatus) {
      updateOrderStatus(orderId, newStatus);
    } else {
      // Fallback if updateOrderStatus not available
      const updatedOrders = orders.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      );
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const getFilteredOrders = () => {
    if (statusFilter === "all") return orders;
    return orders.filter(o => o.status === statusFilter);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCustomerName = (order) => {
    return order.customerName || "Customer";
  };

  // Payment Management Functions
  const getPaymentStats = () => {
    const totalPayments = displayPayments.length;
    const paidAmount = displayPayments
      .filter(p => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = displayPayments.filter(p => p.status === "Pending").length;
    const failedPayments = displayPayments.filter(p => p.status === "Failed").length;

    return { totalPayments, paidAmount, pendingPayments, failedPayments };
  };

  const getPaymentMethodIcon = (method) => {
    const methodMap = {
      "UPI": "UPI",
      "Debit Card": "Card",
      "Credit Card": "Card",
      "Net Banking": "Banking",
      "COD": "COD"
    };
    return methodMap[method] || "Card";
  };

  const getPaymentStatusColor = (status) => {
    const statusMap = {
      "Paid": "Paid",
      "Pending": "Pending",
      "Failed": "Failed",
      "Refunded": "Refunded"
    };
    return statusMap[status] || "Unknown";
  };

  const getCustomers = () => {
    const customerMap = new Map();

    displayPayments.forEach(payment => {
      const rawKey = payment.customerEmail || payment.customerPhone || payment.customerName || payment.orderId || payment.id || "";
      const key = rawKey.toString().toLowerCase() || payment.id;

      const existing = customerMap.get(key) || {
        id: key,
        name: payment.customerName || "Customer",
        email: payment.customerEmail || "N/A",
        phone: payment.customerPhone || "N/A",
        totalSpent: 0,
        orders: new Set(),
        methods: new Set(),
        lastPaymentDate: null,
        paidCount: 0,
        pendingCount: 0,
        failedCount: 0
      };

      existing.totalSpent += Number(payment.amount || 0);
      if (payment.orderId) existing.orders.add(payment.orderId);
      if (payment.method) existing.methods.add(payment.method);
      if (payment.date) {
        existing.lastPaymentDate = !existing.lastPaymentDate || new Date(payment.date) > new Date(existing.lastPaymentDate)
          ? payment.date
          : existing.lastPaymentDate;
      }
      if (payment.status === "Paid") existing.paidCount += 1;
      if (payment.status === "Pending") existing.pendingCount += 1;
      if (payment.status === "Failed") existing.failedCount += 1;

      customerMap.set(key, existing);
    });

    return Array.from(customerMap.values()).map(customer => ({
      ...customer,
      orders: Array.from(customer.orders),
      methods: Array.from(customer.methods)
    }));
  };

  const getCustomerStatus = (customer) => {
    if (customer.paidCount > 0) return { label: "Active", className: "status-paid" };
    if (customer.pendingCount > 0) return { label: "Pending", className: "status-pending" };
    if (customer.failedCount > 0) return { label: "Attention", className: "status-failed" };
    return { label: "New", className: "status-pending" };
  };

  const handleUpdatePaymentStatus = (payment, newStatus) => {
    if (payment?.source === "order" && updateOrderPaymentStatus) {
      updateOrderPaymentStatus(payment.orderNumericId, newStatus);
      return;
    }
    if (updatePaymentStatus) {
      updatePaymentStatus(payment.id, newStatus);
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const getFilteredPayments = () => {
    if (paymentStatusFilter === "all") return displayPayments;
    return displayPayments.filter(p => p.status === paymentStatusFilter);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Payment Form Handlers
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-fill customer info if order is selected
    if (name === "orderId" && value) {
      const selectedOrd = orders.find(o => o.id.toString() === value);
      if (selectedOrd) {
        setPaymentFormData(prev => ({
          ...prev,
          customerName: selectedOrd.customerName || "Customer",
          customerEmail: selectedOrd.deliveryCity || "",
          customerPhone: ""
        }));
      }
    }
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      orderId: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      amount: "",
      method: "UPI",
      status: "Pending"
    });
    setShowAddPaymentForm(false);
  };

  const handleAddPayment = (addPaymentFn) => {
    if (!paymentFormData.orderId || !paymentFormData.customerName || !paymentFormData.amount || !paymentFormData.method) {
      alert("Please fill all required fields");
      return;
    }

    const selectedOrd = orders.find(o => o.id.toString() === paymentFormData.orderId);
    const newPayment = {
      orderId: paymentFormData.orderId,
      transactionId: `TXN${Date.now()}`,
      customerName: paymentFormData.customerName,
      customerEmail: paymentFormData.customerEmail || "N/A",
      customerPhone: paymentFormData.customerPhone || "N/A",
      amount: Number(paymentFormData.amount),
      method: paymentFormData.method,
      status: paymentFormData.status,
      products: selectedOrd?.items?.map(item => item.name) || [],
      totalAmount: Number(paymentFormData.amount)
    };

    addPaymentFn(newPayment);
    alert("Payment Added Successfully!");
    resetPaymentForm();
  };

  const customers = getCustomers();

  const productTableData = useMemo(
    () => products.map(product => ({ ...product, actions: "" })),
    [products]
  );

  const customerTableData = useMemo(
    () => customers.map(customer => {
      const status = getCustomerStatus(customer);
      return {
        ...customer,
        ordersCount: customer.orders.length,
        totalSpentValue: customer.totalSpent,
        lastPaymentDateValue: customer.lastPaymentDate,
        statusLabel: status.label,
        statusClass: status.className
      };
    }),
    [customers, getCustomerStatus]
  );

  const orderTableData = useMemo(
    () => getFilteredOrders().map(order => ({
      ...order,
      customerDisplay: getCustomerName(order),
      customerIdDisplay: order.customerId || "N/A",
      dateDisplay: formatDate(order.date),
      totalAmount: order.total || 0,
      paymentLabel: order.paymentMethod === "cod" ? "COD" : "Online",
      statusLabel: order.status || "Pending",
      actions: ""
    })),
    [getFilteredOrders, getCustomerName, formatDate]
  );

  const paymentTableData = useMemo(
    () => getFilteredPayments().map(payment => ({
      ...payment,
      dateDisplay: formatDate(payment.date),
      methodLabel: `${getPaymentMethodIcon(payment.method)} ${payment.method}`,
      amountValue: payment.amount || 0,
      statusLabel: payment.status || "Pending",
      actions: ""
    })),
    [getFilteredPayments, formatDate, getPaymentMethodIcon]
  );

  const pricingTableData = useMemo(
    () => products.map(product => {
      const purchaseCost = Number(product.purchaseCost ?? product.wholesalePrice ?? 0);
      const sellCost = Number(product.sellCost ?? product.price ?? 0);
      const margin = sellCost - purchaseCost;
      const marginPercent = sellCost > 0 ? ((margin / sellCost) * 100).toFixed(1) : "0.0";
      return {
        ...product,
        purchaseCost,
        sellCost,
        margin,
        marginPercent,
        actions: ""
      };
    }),
    [products]
  );

  const productColumns = useMemo(() => [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "category",
      header: "Category",
      Cell: ({ cell }) => <span className="category-badge">{cell.getValue()}</span>
    },
    {
      accessorKey: "price",
      header: "Retail Price",
      Cell: ({ cell }) => `₹${cell.getValue()}`
    },
    {
      accessorKey: "wholesalePrice",
      header: "Wholesale",
      Cell: ({ cell }) => `₹${cell.getValue()}`
    },
    {
      accessorKey: "purchaseCost",
      header: "Purchase Cost",
      Cell: ({ row }) => `₹${Number(row.original.purchaseCost ?? row.original.wholesalePrice ?? 0).toLocaleString()}`
    },
    {
      accessorKey: "sellCost",
      header: "Sell Cost",
      Cell: ({ row }) => `₹${Number(row.original.sellCost ?? row.original.price ?? 0).toLocaleString()}`
    },
    {
      accessorKey: "stock",
      header: "Stock",
      Cell: ({ row }) => (
        <span className={`stock-badge ${row.original.stock < 50 ? "low" : ""}`}>
          {row.original.stock}
        </span>
      )
    },
    { accessorKey: "moq", header: "MOQ" },
    {
      accessorKey: "actions",
      header: "Actions",
      Cell: ({ row }) => (
        <div className="actions">
          <button
            className="btn-edit"
            onClick={() => handleEditClick(row.original)}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className="btn-delete"
            onClick={() => handleDeleteProduct(row.original.id, row.original.name)}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      )
    }
  ], [handleEditClick, handleDeleteProduct]);

  const customerColumns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Customer",
      Cell: ({ cell }) => <strong>{cell.getValue()}</strong>
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "ordersCount", header: "Orders" },
    {
      accessorKey: "totalSpentValue",
      header: "Total Spent",
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`
    },
    {
      accessorKey: "lastPaymentDateValue",
      header: "Last Payment",
      Cell: ({ cell }) => (cell.getValue() ? formatDate(cell.getValue()) : "N/A")
    },
    {
      accessorKey: "statusLabel",
      header: "Status",
      Cell: ({ row }) => (
        <span className={`payment-status-badge ${row.original.statusClass}`}>
          {row.original.statusLabel}
        </span>
      )
    }
  ], [formatDate]);

  const orderColumns = useMemo(() => [
    {
      accessorKey: "id",
      header: "Order ID",
      Cell: ({ cell }) => <strong>#{cell.getValue()}</strong>
    },
    {
      accessorKey: "customerDisplay",
      header: "Customer",
      Cell: ({ row }) => (
        <div>
          <div>{row.original.customerDisplay}</div>
          <small style={{ color: "#666" }}>ID: {row.original.customerIdDisplay}</small>
        </div>
      )
    },
    { accessorKey: "dateDisplay", header: "Date" },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      Cell: ({ cell }) => <span className="amount">₹{Number(cell.getValue() || 0).toLocaleString()}</span>
    },
    {
      accessorKey: "paymentLabel",
      header: "Payment",
      Cell: ({ cell }) => <span className="payment-badge">{cell.getValue()}</span>
    },
    {
      accessorKey: "statusLabel",
      header: "Status",
      Cell: ({ row }) => (
        <span className={`status-badge status-${row.original.statusLabel?.toLowerCase() || "pending"}`}>
          {getStatusBadge(row.original.statusLabel || "Pending")} {row.original.statusLabel || "Pending"}
        </span>
      )
    },
    {
      accessorKey: "actions",
      header: "Actions",
      Cell: ({ row }) => (
        <div className="actions">
          <button
            className="btn-view"
            onClick={() => handleViewOrder(row.original)}
            title="View Details"
          >
            👁️
          </button>
          <select
            className="btn-status-select"
            value={row.original.statusLabel || "Pending"}
            onChange={(e) => handleUpdateOrderStatus(row.original.id, e.target.value)}
            title="Update Status"
          >
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      )
    }
  ], [handleUpdateOrderStatus, handleViewOrder, getStatusBadge]);

  const paymentColumns = useMemo(() => [
    {
      accessorKey: "id",
      header: "Payment ID",
      Cell: ({ cell }) => <strong>{cell.getValue()}</strong>
    },
    { accessorKey: "orderId", header: "Order ID" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "dateDisplay", header: "Date" },
    {
      accessorKey: "methodLabel",
      header: "Method",
      Cell: ({ cell }) => <span className="method-badge">{cell.getValue()}</span>
    },
    {
      accessorKey: "amountValue",
      header: "Amount",
      Cell: ({ cell }) => <span className="amount">₹{Number(cell.getValue() || 0).toLocaleString()}</span>
    },
    {
      accessorKey: "statusLabel",
      header: "Status",
      Cell: ({ row }) => (
        <span className={`payment-status-badge status-${row.original.statusLabel?.toLowerCase() || "pending"}`}>
          {getPaymentStatusColor(row.original.statusLabel || "Pending")} {row.original.statusLabel || "Pending"}
        </span>
      )
    },
    {
      accessorKey: "actions",
      header: "Actions",
      Cell: ({ row }) => (
        <div className="actions">
          <button
            className="btn-view"
            onClick={() => handleViewPayment(row.original)}
            title="View Details"
          >
            👁️
          </button>
          <select
            className="btn-status-select"
            value={row.original.statusLabel || "Pending"}
            onChange={(e) => handleUpdatePaymentStatus(row.original.id, e.target.value)}
            title="Update Status"
          >
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      )
    }
  ], [handleUpdatePaymentStatus, handleViewPayment, getPaymentStatusColor]);

  const pricingColumns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Product",
      Cell: ({ row }) => (
        <div>
          <strong>{row.original.name}</strong>
          <br />
          <small>{row.original.category}</small>
        </div>
      )
    },
    {
      accessorKey: "price",
      header: "Retail Price",
      Cell: ({ cell }) => <span className="price">₹{cell.getValue()}</span>
    },
    {
      accessorKey: "wholesalePrice",
      header: "Wholesale Price",
      Cell: ({ cell }) => <span className="price">₹{cell.getValue()}</span>
    },
    {
      accessorKey: "purchaseCost",
      header: "Purchase Cost",
      Cell: ({ cell }) => <span className="price">₹{Number(cell.getValue() || 0).toLocaleString()}</span>
    },
    {
      accessorKey: "sellCost",
      header: "Sell Cost",
      Cell: ({ cell }) => <span className="price">₹{Number(cell.getValue() || 0).toLocaleString()}</span>
    },
    {
      accessorKey: "margin",
      header: "Margin",
      Cell: ({ cell }) => <span className="margin">₹{cell.getValue()}</span>
    },
    {
      accessorKey: "marginPercent",
      header: "Discount %",
      Cell: ({ row }) => <span className="discount-badge">{row.original.marginPercent}%</span>
    },
    {
      accessorKey: "actions",
      header: "Action",
      Cell: ({ row }) => (
        <button
          className="btn-edit-small"
          onClick={() => handleEditClick(row.original)}
        >
          Edit Pricing
        </button>
      )
    }
  ], [handleEditClick]);


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


  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <h3> Admin Panel</h3>
        <nav className="admin-nav">
          <button 
            className={activeTab === "products" ? "active" : ""} 
            onClick={() => setActiveTab("products")}
          >
             Products
          </button>
          <button 
            className={activeTab === "orders" ? "active" : ""} 
            onClick={() => { setActiveTab("orders"); setStatusFilter("all"); }}
          >
            Orders
          </button>
          <button 
            className={activeTab === "payments" ? "active" : ""} 
            onClick={() => { setActiveTab("payments"); setPaymentStatusFilter("all"); }}
          >
            Payments
          </button>
          <button 
            className={activeTab === "customers" ? "active" : ""} 
            onClick={() => setActiveTab("customers")}
          >
            Customers
          </button>
          <button 
            className={activeTab === "stock" ? "active" : ""} 
            onClick={() => setActiveTab("stock")}
          >
             Stock Management
          </button>
          <button 
            className={activeTab === "pricing" ? "active" : ""} 
            onClick={() => setActiveTab("pricing")}
          >
            Pricing
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <div className="admin-header">
          <h1>
            {activeTab === "products" && "Product Management Dashboard"}
            {activeTab === "orders" && "Order Management Dashboard"}
            {activeTab === "payments" && "Payment Management Dashboard"}
            {activeTab === "customers" && "Customer Management Dashboard"}
            {activeTab === "stock" && "Stock Management Dashboard"}
            {activeTab === "pricing" && "Pricing Management"}
          </h1>
          {lowStockProducts.length > 0 && (
            <div className="admin-alert warning">
              <strong>⚠️ Low Stock Alert:</strong> {lowStockProducts.length} products need restocking.
              <span className="alert-hint">
                {lowStockProducts.slice(0, 3).map(p => p.name).join(", ")}
                {lowStockProducts.length > 3 && ` +${lowStockProducts.length - 3} more`}
              </span>
            </div>
          )}
          <div className="admin-stats">
            {activeTab !== "orders" && (
              <>
                <div className="stat-card">
                  <span className="stat-label">Total Products</span>
                  <span className="stat-value">{products.length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Low Stock Items</span>
                  <span className="stat-value warning">{getLowStockProducts().length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Inventory Value</span>
                  <span className="stat-value">₹{getTotalInventoryValue().toLocaleString()}</span>
                </div>
              </>
            )}
            {activeTab === "orders" && (
              <>
                <div className="stat-card">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-value">{getOrderStats().totalOrders}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Pending Orders</span>
                  <span className="stat-value warning">{getOrderStats().pendingOrders}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Delivered Orders</span>
                  <span className="stat-value success">{getOrderStats().deliveredOrders}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Total Revenue</span>
                  <span className="stat-value">₹{getOrderStats().totalRevenue.toLocaleString()}</span>
                </div>
              </>
            )}
            {activeTab === "payments" && (
              <>
                <div className="stat-card">
                  <span className="stat-label">Total Payments</span>
                  <span className="stat-value">{getPaymentStats().totalPayments}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Paid Amount</span>
                  <span className="stat-value success">₹{getPaymentStats().paidAmount.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Pending Payments</span>
                  <span className="stat-value warning">{getPaymentStats().pendingPayments}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Failed Payments</span>
                  <span className="stat-value" style={{color: '#ef4444'}}>{getPaymentStats().failedPayments}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Product Catalog</h2>
              {!showAddForm && (
                <button className="btn-add" onClick={() => setShowAddForm(true)}>
                  ➕ Add New Product
                </button>
              )}
            </div>

            {showAddForm && (
              <div className="product-form-card">
                <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Rice 25kg"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select name="category" value={formData.category} onChange={handleInputChange}>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{displayCategory(cat)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Retail Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="1200"
                    />
                  </div>

                  <div className="form-group">
                    <label>Wholesale Price (₹) *</label>
                    <input
                      type="number"
                      name="wholesalePrice"
                      value={formData.wholesalePrice}
                      onChange={handleInputChange}
                      placeholder="1050"
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="150"
                    />
                  </div>

                  <div className="form-group">
                    <label>Purchase Cost (₹) *</label>
                    <input
                      type="number"
                      name="purchaseCost"
                      value={formData.purchaseCost}
                      onChange={handleInputChange}
                      placeholder="900"
                    />
                  </div>

                  <div className="form-group">
                    <label>Sell Cost (₹) *</label>
                    <input
                      type="number"
                      name="sellCost"
                      value={formData.sellCost}
                      onChange={handleInputChange}
                      placeholder="1200"
                    />
                  </div>

                  <div className="form-group">
                    <label>Minimum Order Qty</label>
                    <input
                      type="number"
                      name="moq"
                      value={formData.moq}
                      onChange={handleInputChange}
                      placeholder="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Unit</label>
                    <select name="unit" value={formData.unit} onChange={handleInputChange}>
                      {units.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Product Image</label>
                    <div className="image-upload-container">
                      {imagePreview ? (
                        <div className="image-preview-wrapper">
                          <img src={imagePreview} alt="Product preview" className="image-preview" />
                          <button type="button" className="btn-remove-image" onClick={removeImage}>
                            ✕ Remove Image
                          </button>
                        </div>
                      ) : (
                        <div className="image-upload-area">
                          <input
                            type="file"
                            id="product-image"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="product-image" className="image-upload-label">
                            <span className="upload-icon">📷</span>
                            <span className="upload-text">Click to upload product image</span>
                            <span className="upload-hint">PNG, JPG, JPEG up to 5MB</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief product description"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  {editingProduct ? (
                    <button className="btn-update" onClick={handleUpdateProduct}>
                      💾 Update Product
                    </button>
                  ) : (
                    <button className="btn-save" onClick={handleAddProduct}>
                      ✅ Save Product
                    </button>
                  )}
                  <button className="btn-cancel" onClick={resetForm}>
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="products-table">
              <CommonTable
                columns={productColumns}
                data={productTableData}
                fileName="products"
              />
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Customer Directory</h2>
            </div>

            <div className="customers-table">
              {customers.length === 0 ? (
                <div className="empty-state">
                  <p>No customer records available.</p>
                </div>
              ) : (
                <CommonTable
                  columns={customerColumns}
                  data={customerTableData}
                  fileName="customers"
                />
              )}
            </div>
          </div>
        )}

        {/* Stock Management Tab */}
        {activeTab === "stock" && (
          <div className="admin-section">
            <h2>Stock Management</h2>
            
            {getLowStockProducts().length > 0 && (
              <div className="alert-box warning">
                <strong>⚠️ Low Stock Alert:</strong> {getLowStockProducts().length} products need restocking
              </div>
            )}

            <div className="stock-grid">
              {products.map(product => (
                <div key={product.id} className={`stock-card ${product.stock < 50 ? 'low-stock' : ''}`}>
                  <div className="stock-header">
                    <h4>{product.name}</h4>
                    <span className="category-badge">{product.category}</span>
                  </div>
                  <div className="stock-info">
                    <div className="info-row">
                      <span>Current Stock:</span>
                      <strong className={product.stock < 50 ? 'text-warning' : 'text-success'}>
                        {product.stock} {product.unit}s
                      </strong>
                    </div>
                    <div className="info-row">
                      <span>MOQ:</span>
                      <strong>{product.moq}</strong>
                    </div>
                    <div className="info-row">
                      <span>Avg Purchase Price:</span>
                      <strong>₹{Number(product.purchaseCost ?? product.wholesalePrice ?? 0).toLocaleString()}</strong>
                    </div>
                    <div className="stock-value">
                      Stock Value: ₹{(Number(product.purchaseCost ?? product.wholesalePrice ?? 0) * product.stock).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    className="btn-stock-update"
                    onClick={() => handleStockUpdate(product)}
                  >
                    📝 Update Stock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="admin-section">
            <h2>Pricing Overview</h2>
            
            <div className="pricing-table">
              <CommonTable
                columns={pricingColumns}
                data={pricingTableData}
                fileName="pricing"
              />
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Order Management</h2>
              <div className="status-filters">
                <button 
                  className={statusFilter === "all" ? "active" : ""} 
                  onClick={() => setStatusFilter("all")}
                >
                  All ({orders.length})
                </button>
                <button 
                  className={statusFilter === "Pending" ? "active" : ""} 
                  onClick={() => setStatusFilter("Pending")}
                >
                  Pending ({orders.filter(o => o.status === "Pending").length})
                </button>
                <button 
                  className={statusFilter === "Processing" ? "active" : ""} 
                  onClick={() => setStatusFilter("Processing")}
                >
                  Processing ({orders.filter(o => o.status === "Processing").length})
                </button>
                <button 
                  className={statusFilter === "Delivered" ? "active" : ""} 
                  onClick={() => setStatusFilter("Delivered")}
                >
                  Delivered ({orders.filter(o => o.status === "Delivered").length})
                </button>
                <button 
                  className={statusFilter === "Cancelled" ? "active" : ""} 
                  onClick={() => setStatusFilter("Cancelled")}
                >
                  Cancelled ({orders.filter(o => o.status === "Cancelled").length})
                </button>
              </div>
            </div>

            {getFilteredOrders().length === 0 ? (
              <div className="empty-state">
                <p>No orders found</p>
              </div>
            ) : (
              <div className="orders-table">
                <CommonTable
                  columns={orderColumns}
                  data={orderTableData}
                  fileName="orders"
                />
              </div>
            )}

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
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
                          <span className="value">{getCustomerName(selectedOrder)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Status:</span>
                          <span className="value">
                            {getStatusBadge(selectedOrder.status || "Pending")} {selectedOrder.status || "Pending"}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Payment Method:</span>
                          <span className="value">{selectedOrder.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Payment Status:</span>
                          <span className="value">{selectedOrder.paymentStatus || "Pending"}</span>
                        </div>
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
                          fileName={`order-${selectedOrder.id}-items`}
                          showSelection={false}
                        />
                      </div>
                    </div>

                    <div className="order-detail-section order-summary">
                      <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>₹{(selectedOrder.total || 0).toLocaleString()}</span>
                      </div>
                      <div className="summary-row">
                        <span>Delivery Charges:</span>
                        <span>₹0</span>
                      </div>
                      <div className="summary-row total">
                        <span>Total Amount:</span>
                        <span>₹{(selectedOrder.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button 
                      className="btn-close"
                      onClick={() => setShowOrderModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Payment Management</h2>
              {!showAddPaymentForm && (
                <button className="btn-add" onClick={() => setShowAddPaymentForm(true)}>
                  ➕ Add New Payment
                </button>
              )}
            </div>

            {showAddPaymentForm && (
              <div className="product-form-card">
                <h3>Add New Payment</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Select Order *</label>
                    <select 
                      name="orderId" 
                      value={paymentFormData.orderId} 
                      onChange={handlePaymentInputChange}
                    >
                      <option value="">-- Select an Order --</option>
                      {orders.map(order => (
                        <option key={order.id} value={order.id}>
                          #{order.id} - {order.customerName || "Customer"} (₹{order.total || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      name="customerName"
                      value={paymentFormData.customerName}
                      onChange={handlePaymentInputChange}
                      placeholder="Customer name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Customer Email</label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={paymentFormData.customerEmail}
                      onChange={handlePaymentInputChange}
                      placeholder="customer@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Customer Phone</label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={paymentFormData.customerPhone}
                      onChange={handlePaymentInputChange}
                      placeholder="+91-9876543210"
                    />
                  </div>

                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input
                      type="number"
                      name="amount"
                      value={paymentFormData.amount}
                      onChange={handlePaymentInputChange}
                      placeholder="2450"
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Method *</label>
                    <select name="method" value={paymentFormData.method} onChange={handlePaymentInputChange}>
                      <option value="UPI">UPI</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="COD">Cash on Delivery</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Payment Status *</label>
                    <select name="status" value={paymentFormData.status} onChange={handlePaymentInputChange}>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={() => handleAddPayment(addPayment)}>
                    ✅ Add Payment
                  </button>
                  <button className="btn-cancel" onClick={resetPaymentForm}>
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="section-header" style={{marginTop: '20px', borderTop: '2px solid #e5e7eb', paddingTop: '20px', marginBottom: '0'}}>
              <h3 style={{margin: '0', fontSize: '18px'}}>Payments List</h3>
              <div className="status-filters">
                <button 
                  className={paymentStatusFilter === "all" ? "active" : ""} 
                  onClick={() => setPaymentStatusFilter("all")}
                >
                  All ({displayPayments.length})
                </button>
                <button 
                  className={paymentStatusFilter === "Paid" ? "active" : ""} 
                  onClick={() => setPaymentStatusFilter("Paid")}
                >
                  Paid ({displayPayments.filter(p => p.status === "Paid").length})
                </button>
                <button 
                  className={paymentStatusFilter === "Pending" ? "active" : ""} 
                  onClick={() => setPaymentStatusFilter("Pending")}
                >
                  Pending ({displayPayments.filter(p => p.status === "Pending").length})
                </button>
                <button 
                  className={paymentStatusFilter === "Failed" ? "active" : ""} 
                  onClick={() => setPaymentStatusFilter("Failed")}
                >
                  Failed ({displayPayments.filter(p => p.status === "Failed").length})
                </button>
                <button 
                  className={paymentStatusFilter === "Refunded" ? "active" : ""} 
                  onClick={() => setPaymentStatusFilter("Refunded")}
                >
                  Refunded ({displayPayments.filter(p => p.status === "Refunded").length})
                </button>
              </div>
            </div>

            {getFilteredPayments().length === 0 ? (
              <div className="empty-state">
                <p>No payments found</p>
              </div>
            ) : (
              <div className="payments-table">
                <CommonTable
                  columns={paymentColumns}
                  data={paymentTableData}
                  fileName="payments"
                />
              </div>
            )}

            {/* Payment Details Modal */}
            {showPaymentModal && selectedPayment && (
              <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Payment Details - {selectedPayment.id}</h2>
                    <button 
                      className="modal-close"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="modal-body">
                    <div className="order-detail-section">
                      <h3>Payment Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="label">Payment ID:</span>
                          <span className="value">{selectedPayment.id}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Transaction ID:</span>
                          <span className="value">{selectedPayment.transactionId || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Payment Method:</span>
                          <span className="value">{getPaymentMethodIcon(selectedPayment.method)} {selectedPayment.method}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Date & Time:</span>
                          <span className="value">{formatDateTime(selectedPayment.date)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Status:</span>
                          <span className="value">{getPaymentStatusColor(selectedPayment.status)} {selectedPayment.status}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Amount:</span>
                          <span className="value" style={{fontSize: '16px', fontWeight: 'bold', color: '#10b981'}}>
                            ₹{selectedPayment.amount?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="order-detail-section">
                      <h3>Order Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="label">Order ID:</span>
                          <span className="value">{selectedPayment.orderId}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Total Amount:</span>
                          <span className="value">₹{selectedPayment.totalAmount?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                      {selectedPayment.products && selectedPayment.products.length > 0 && (
                        <div className="products-list" style={{marginTop: '12px'}}>
                          <strong>Products Ordered:</strong>
                          <ul style={{marginTop: '8px', marginBottom: '0', paddingLeft: '20px'}}>
                            {selectedPayment.products.map((product, idx) => (
                              <li key={idx} style={{marginBottom: '4px', color: '#6b7280'}}>{product}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="order-detail-section">
                      <h3>Customer Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="label">Customer Name:</span>
                          <span className="value">{selectedPayment.customerName}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Email:</span>
                          <span className="value">{selectedPayment.customerEmail}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Mobile:</span>
                          <span className="value">{selectedPayment.customerPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="order-summary" style={{backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px'}}>
                        <strong>Payment Status:</strong>
                        <span style={{padding: '8px 16px', borderRadius: '20px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold'}}>
                          {getPaymentStatusColor(selectedPayment.status)} {selectedPayment.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button 
                      className="btn-close"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;