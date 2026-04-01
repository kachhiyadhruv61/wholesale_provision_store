import { useState, useContext, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProductContext } from "../context/ProductContext";
import { OrderContext } from "../context/OrderContext";
import { PaymentContext } from "../context/PaymentContext";
import { NotificationContext } from "../context/NotificationContext";
import CommonTable from "../components/CommonTable";
// import { apiClient } from "../utils/apiClient";
import { apiFetch } from "../utils/apiFetch";

const normalizeLookupKey = (value) => String(value || "").trim().toLowerCase();
const normalizePhoneKey = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const getPreferredCustomerName = (candidate = {}) => {
  const options = [
    candidate.customerName,
    candidate.fullname,
    candidate.ownerName,
    candidate.username,
    candidate.name,
  ];

  const matched = options.find((value) => String(value || "").trim() && String(value).trim().toLowerCase() !== "customer");
  return matched ? String(matched).trim() : "Customer";
};

const parseJsonOrThrow = async (response) => {
  const contentType = response?.headers?.get?.('content-type') || '';
  if (!contentType.includes('application/json')) {
    const body = await response.text();
    const preview = String(body || '').slice(0, 120).replace(/\s+/g, ' ').trim();
    throw new Error(`API returned non-JSON response${preview ? `: ${preview}` : ''}`);
  }

  return response.json();
};

function AdminDashboard() {
  const {
    products = [],
    productsLoading = false,
    productsError = "",
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
  } = useContext(ProductContext) || {};
  const { orders = [], ordersLoading = false, ordersError = "", updateOrderStatus, updateOrderPaymentStatus } = useContext(OrderContext) || {};
  const { payments = [], addPayment, updatePaymentStatus } = useContext(PaymentContext) || {};
  const { addNotification } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [registeredUsers, setRegisteredUsers] = useState([]);

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
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState("");
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState("");
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorFormData, setVendorFormData] = useState({
    vendorName: "",
    companyName: "",
    mobileNumber: "",
    gstNumber: "",
    email: "",
    productCategory: "Other",
    notes: "",
  });
  const [expenseFormData, setExpenseFormData] = useState({
    date: "",
    transportation_loading: "",
    shop_warehouse_expenses: "",
    staff_salary: "",
    damages_wastage: "",
    financial_charges: "",
    taxes: "",
    other_charges: "",
    notes: "",
  });
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);
  const [stockFormData, setStockFormData] = useState({
    stock: "",
    purchasePrice: ""
  });
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
  const vendorCategoryOptions = [
    "Other",
    "Grocery",
    "Masala Spices",
    "Pan Center",
    "Daily Used Product",
    "Snacks",
    "Biscuit",
    "Chocolates",
  ];

  useEffect(() => {
    let isMounted = true;

    const parseUsersPayload = async (res) => {
      const payload = await res.json();
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload)) return payload;
      return [];
    };

    const loadRegisteredUsers = async () => {
      try {
        let normalizedUsers = [];

        // Registered customer master data is served by /register in backend login routes.
        const registerRes = await apiFetch("/register", { method: "GET" });
        if (registerRes?.ok) {
          normalizedUsers = await parseUsersPayload(registerRes);
        } else {
          const apiRegisterRes = await apiFetch("/api/register", { method: "GET" });
          if (apiRegisterRes?.ok) {
            normalizedUsers = await parseUsersPayload(apiRegisterRes);
          }
        }

        if (isMounted) {
          setRegisteredUsers(normalizedUsers);
        }
      } catch {
        if (isMounted) {
          setRegisteredUsers([]);
        }
      }
    };

    loadRegisteredUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadVendors = async () => {
      if (isMounted) {
        setVendorsLoading(true);
        setVendorsError("");
      }

      try {
        let response = await apiFetch('/vendors', { method: 'GET' });
        if (!response?.ok) {
          response = await apiFetch('/api/vendors', { method: 'GET' });
        }

        if (!response?.ok) {
          throw new Error('Unable to load vendors');
        }

        const payload = await parseJsonOrThrow(response);
        const vendorRows = Array.isArray(payload?.data) ? payload.data : [];

        if (isMounted) {
          setVendors(vendorRows);
          setVendorsError("");
        }
      } catch (error) {
        if (isMounted) {
          setVendors([]);
          setVendorsError(error?.message || 'Unable to load vendors.');
        }
      } finally {
        if (isMounted) {
          setVendorsLoading(false);
        }
      }
    };

    loadVendors();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadExpenses = async () => {
      if (isMounted) {
        setExpensesLoading(true);
        setExpensesError("");
      }

      try {
        let response = await apiFetch('/expenses', { method: 'GET' });
        if (!response?.ok) {
          response = await apiFetch('/api/expenses', { method: 'GET' });
        }

        if (!response?.ok) {
          throw new Error('Unable to load expenses');
        }

        const payload = await parseJsonOrThrow(response);
        const expenseRows = Array.isArray(payload?.data) ? payload.data : [];

        if (isMounted) {
          setExpenses(expenseRows);
          setExpensesError("");
        }
      } catch (error) {
        if (isMounted) {
          setExpenses([]);
          setExpensesError(error?.message || 'Unable to load expenses.');
        }
      } finally {
        if (isMounted) {
          setExpensesLoading(false);
        }
      }
    };

    loadExpenses();

    return () => {
      isMounted = false;
    };
  }, []);

  const registeredUserLookup = useMemo(() => {
    const lookup = new Map();

    (registeredUsers || []).forEach((entry) => {
      const normalizedUser = {
        ...entry,
        customerName: getPreferredCustomerName(entry),
        customerEmail: entry.email || "",
        customerPhone: entry.phonenumber || entry.phone || "",
      };

      [entry._id, entry.id, entry.email, entry.username].forEach((value) => {
        const key = normalizeLookupKey(value);
        if (key) {
          lookup.set(key, normalizedUser);
        }
      });
    });

    return lookup;
  }, [registeredUsers]);

  const resolveCustomerDetails = (record = {}, fallbackRecord = null) => {
    const candidates = [record, fallbackRecord].filter(Boolean);
    const lookupMatch = candidates
      .flatMap((entry) => [entry.customerId, entry.userId, entry.customerEmail, entry.email, entry.customerUsername, entry.username])
      .map((value) => registeredUserLookup.get(normalizeLookupKey(value)))
      .find(Boolean);

    const merged = {
      ...(lookupMatch || {}),
      ...(fallbackRecord || {}),
      ...(record || {}),
    };

    return {
      customerName: getPreferredCustomerName(merged),
      customerEmail: merged.customerEmail || merged.email || lookupMatch?.customerEmail || "N/A",
      customerPhone: merged.customerPhone || merged.phonenumber || merged.phone || lookupMatch?.customerPhone || "N/A",
      customerId: merged.customerId || merged.userId || lookupMatch?._id || lookupMatch?.id || null,
      customerUsername: merged.customerUsername || merged.username || lookupMatch?.username || "",
    };
  };

  const enrichedOrders = useMemo(
    () => orders.map((order) => ({
      ...order,
      ...resolveCustomerDetails(order),
    })),
    [orders, registeredUserLookup]
  );

  const orderLookup = useMemo(() => {
    const lookup = new Map();
    enrichedOrders.forEach((order) => {
      lookup.set(String(order.id), order);
      if (order._id) {
        lookup.set(String(order._id), order);
      }
      if (order.orderId) {
        lookup.set(String(order.orderId), order);
      }
    });
    return lookup;
  }, [enrichedOrders]);

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

  const handleAddProduct = async () => {
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

    const result = await addProduct(newProduct);
    if (result?.success === false) {
      alert(result.message || "Unable to add product.");
      return;
    }
    alert("Product Added Successfully!");
    resetForm();
  };

  const handleUpdateProduct = async () => {
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

    const result = await updateProduct(editingProduct.id, updatedProduct);
    if (result?.success === false) {
      alert(result.message || "Unable to update product.");
      return;
    }
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

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const result = await deleteProduct(id);
      if (result?.success === false) {
        alert(result.message || "Unable to delete product.");
        return;
      }
      alert("Product Deleted Successfully!");
    }
  };

  const openStockModal = (product) => {
    const currentStock = Number(product?.stock || 0);
    const currentPurchase = Number(product?.purchaseCost ?? product?.wholesalePrice ?? product?.price ?? 0);

    setSelectedStockProduct(product);
    setStockFormData({
      stock: String(currentStock),
      purchasePrice: String(currentPurchase || "")
    });
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedStockProduct(null);
    setStockFormData({ stock: "", purchasePrice: "" });
  };

  const handleStockFormChange = (e) => {
    const { name, value } = e.target;
    setStockFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStockUpdate = async () => {
    if (!selectedStockProduct) return;

    const currentStock = Number(selectedStockProduct.stock || 0);
    const previousAvgPurchase = Number(
      selectedStockProduct.purchaseCost ?? selectedStockProduct.wholesalePrice ?? selectedStockProduct.price ?? 0
    );

    if (stockFormData.stock === "" || isNaN(stockFormData.stock)) {
      alert("Please enter a valid stock quantity.");
      return;
    }

    if (stockFormData.purchasePrice === "" || isNaN(stockFormData.purchasePrice)) {
      alert("Please enter a valid purchase price.");
      return;
    }

    const parsedStock = Number(stockFormData.stock);
    const newPurchasePrice = Number(stockFormData.purchasePrice);

    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      alert("Stock cannot be negative.");
      return;
    }

    if (!Number.isFinite(newPurchasePrice) || newPurchasePrice < 0) {
      alert("Purchase price cannot be negative.");
      return;
    }

    const addedQty = Math.max(parsedStock - currentStock, 0);
    const nextAvgPurchase = addedQty > 0
      ? (
        currentStock <= 0
          ? newPurchasePrice
          : ((previousAvgPurchase * currentStock) + (newPurchasePrice * addedQty)) / parsedStock
      )
      : previousAvgPurchase;

    const stockResult = await updateStock(selectedStockProduct.id, parsedStock, { purchaseCost: Number(nextAvgPurchase.toFixed(2)) });
    if (stockResult?.success === false) {
      alert(stockResult.message || "Unable to update stock.");
      return;
    }

    if (currentStock >= 50 && parsedStock < 50) {
      addNotification({
        type: "stock",
        title: "Low stock alert",
        message: `${selectedStockProduct?.name || "Item"} is low on stock (${parsedStock} left).`,
        meta: {
          product: selectedStockProduct?.name,
          stock: parsedStock,
        },
      });
    }

    closeStockModal();
    alert(`Stock updated successfully!\nAverage purchase price: ₹${nextAvgPurchase.toFixed(2)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/");
  };

  const handleAdminHome = () => {
    window.location.href = "http://localhost:3000/admin-home";
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.stock < 50);
  };

  const lowStockProducts = useMemo(() => getLowStockProducts(), [products]);

  const previewStock = Number(stockFormData.stock || 0);
  const previewPurchasePrice = Number(stockFormData.purchasePrice || 0);
  const previewCurrentStock = Number(selectedStockProduct?.stock || 0);
  const previewCurrentAvg = Number(
    selectedStockProduct?.purchaseCost ?? selectedStockProduct?.wholesalePrice ?? selectedStockProduct?.price ?? 0
  );
  const previewAddedQty = Math.max(previewStock - previewCurrentStock, 0);
  const previewWeightedAvg = previewAddedQty > 0
    ? (
      previewCurrentStock <= 0
        ? previewPurchasePrice
        : ((previewCurrentAvg * previewCurrentStock) + (previewPurchasePrice * previewAddedQty)) / previewStock
    )
    : previewCurrentAvg;


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

  const normalizeOrderStatus = (status) => {
    const value = String(status || "").trim().toLowerCase();
    if (!value) return "Pending";
    if (value === "canceled") return "Cancelled";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const paymentsFromOrders = useMemo(() => (
    enrichedOrders.map(order => ({
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
  ), [enrichedOrders]);

  const manualPayments = payments;

  const displayPayments = useMemo(() => {
    const orderIds = new Set(paymentsFromOrders.map(p => p.orderId?.toString()));
    const extraPayments = (payments || [])
      .filter(p => !orderIds.has(p.orderId?.toString()))
      .map((payment) => {
        const relatedOrder = orderLookup.get(String(payment.orderId || ""));
        return {
          ...payment,
          ...resolveCustomerDetails(payment, relatedOrder),
        };
      });
    return [...paymentsFromOrders, ...extraPayments];
  }, [paymentsFromOrders, payments, orderLookup, registeredUserLookup]);

  const getTotalInventoryValue = () => {
    return products.reduce((total, p) => total + (p.price * p.stock), 0);
  };

  // Order Management Functions
  const getOrderStats = () => {
    const totalOrders = enrichedOrders.length;
    const pendingOrders = enrichedOrders.filter(o => normalizeOrderStatus(o.status) === "Pending").length;
    const deliveredOrders = enrichedOrders.filter(o => normalizeOrderStatus(o.status) === "Delivered").length;
    const totalRevenue = enrichedOrders.reduce((sum, o) => sum + o.total, 0);

    return { totalOrders, pendingOrders, deliveredOrders, totalRevenue };
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      "Pending": "Pending",
      "Processing": "Processing",
      "Delivered": "Delivered",
      "Cancelled": "Cancelled"
    };
    return statusMap[normalizeOrderStatus(status)] || "Unknown";
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (updateOrderStatus) {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result?.success === false) {
        alert(result.message || "Unable to update order status.");
      }
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
    if (statusFilter === "all") return enrichedOrders;
    return enrichedOrders.filter(o => normalizeOrderStatus(o.status) === statusFilter);
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
    return resolveCustomerDetails(order).customerName;
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
    const customerAliases = new Map();

    const buildCustomerKeys = (resolved = {}, input = {}) => {
      const keys = [
        normalizeLookupKey(resolved.customerId),
        normalizeLookupKey(input.customerId || input.userId),
        normalizeLookupKey(resolved.customerEmail !== "N/A" ? resolved.customerEmail : ""),
        normalizeLookupKey(input.customerEmail !== "N/A" ? input.customerEmail : input.email),
        normalizePhoneKey(resolved.customerPhone !== "N/A" ? resolved.customerPhone : ""),
        normalizePhoneKey(input.customerPhone !== "N/A" ? input.customerPhone : input.phone || input.phonenumber),
        normalizeLookupKey(resolved.customerUsername),
        normalizeLookupKey(input.username),
      ];

      const resolvedName = normalizeLookupKey(resolved.customerName);
      const inputName = normalizeLookupKey(input.customerName || input.name || input.fullname || input.ownerName);
      if (resolvedName && resolvedName !== "customer") keys.push(`name:${resolvedName}`);
      if (inputName && inputName !== "customer") keys.push(`name:${inputName}`);

      return [...new Set(keys.filter(Boolean))];
    };

    const ensureCustomer = (input = {}) => {
      const resolved = resolveCustomerDetails(input);
      const candidateKeys = buildCustomerKeys(resolved, input);
      const matchedPrimaryKey = candidateKeys
        .map((key) => customerAliases.get(key))
        .find(Boolean);

      // Use customer IDENTITY fields as key (not the record's own _id/orderId)
      // so that orders/payments merge into the same entry as the registered user.
      const customerKey =
        matchedPrimaryKey ||
        candidateKeys[0] ||
        normalizeLookupKey(input._id || input.id) ||
        `customer-${customerMap.size + 1}`;

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: customerKey,
          name: resolved.customerName || "Customer",
          email: resolved.customerEmail || "N/A",
          phone: resolved.customerPhone || "N/A",
          totalSpent: 0,
          orders: new Set(),
          methods: new Set(),
          lastPaymentDate: null,
          paidCount: 0,
          pendingCount: 0,
          failedCount: 0
        });
      }

      const existing = customerMap.get(customerKey);
      if (resolved.customerName && resolved.customerName !== "Customer") existing.name = resolved.customerName;
      if (resolved.customerEmail && resolved.customerEmail !== "N/A") existing.email = resolved.customerEmail;
      if (resolved.customerPhone && resolved.customerPhone !== "N/A") existing.phone = resolved.customerPhone;

      // Keep aliases updated so future records with partial identity still merge.
      buildCustomerKeys(existing, input).forEach((aliasKey) => {
        customerAliases.set(aliasKey, customerKey);
      });

      return existing;
    };

    registeredUsers.forEach((user) => {
      ensureCustomer(user);
    });

    enrichedOrders.forEach((order) => {
      const customer = ensureCustomer(order);
      if (order.id) customer.orders.add(order.id);
      if (order.paymentMethod) customer.methods.add(normalizePaymentMethod(order.paymentMethod));
    });

    displayPayments.forEach(payment => {
      const existing = ensureCustomer(payment);

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
      const selectedOrd = enrichedOrders.find(o => o.id.toString() === value);
      if (selectedOrd) {
        setPaymentFormData(prev => ({
          ...prev,
          customerName: selectedOrd.customerName || "Customer",
          customerEmail: selectedOrd.customerEmail || "",
          customerPhone: selectedOrd.customerPhone || ""
        }));
      }
    }
  };

  const handleExpenseInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVendorInputChange = (e) => {
    const { name, value } = e.target;
    setVendorFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      date: "",
      transportation_loading: "",
      shop_warehouse_expenses: "",
      staff_salary: "",
      damages_wastage: "",
      financial_charges: "",
      taxes: "",
      other_charges: "",
      notes: "",
    });
    setShowAddExpenseForm(false);
  };

  const handleAddExpense = async () => {
    if (!expenseFormData.date) {
      alert('Date is required');
      return;
    }

    const numericFields = [
      'transportation_loading',
      'shop_warehouse_expenses',
      'staff_salary',
      'damages_wastage',
      'financial_charges',
      'taxes',
      'other_charges',
    ];

    const hasInvalid = numericFields.some((field) => {
      const parsed = Number(expenseFormData[field]);
      return !Number.isFinite(parsed) || parsed < 0;
    });

    if (hasInvalid) {
      alert('Please enter valid non-negative values for all numeric expense fields.');
      return;
    }

    const payload = {
      date: expenseFormData.date,
      transportation_loading: Number(expenseFormData.transportation_loading),
      shop_warehouse_expenses: Number(expenseFormData.shop_warehouse_expenses),
      staff_salary: Number(expenseFormData.staff_salary),
      damages_wastage: Number(expenseFormData.damages_wastage),
      financial_charges: Number(expenseFormData.financial_charges),
      taxes: Number(expenseFormData.taxes),
      other_charges: Number(expenseFormData.other_charges),
      notes: expenseFormData.notes,
    };

    try {
      let response = await apiFetch('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response?.ok) {
        response = await apiFetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await parseJsonOrThrow(response);

      if (!response?.ok || result?.success === false) {
        const fallbackError = Array.isArray(result?.errors)
          ? result.errors.map((entry) => entry?.msg).filter(Boolean).join(', ')
          : '';
        throw new Error(result?.message || fallbackError || 'Unable to add expense');
      }

      const createdExpense = result?.data;
      if (createdExpense) {
        setExpenses((prev) => [createdExpense, ...prev]);
      }

      alert('Expense added successfully');
      resetExpenseForm();
    } catch (error) {
      alert(error?.message || 'Unable to add expense.');
    }
  };

  const resetVendorForm = () => {
    setVendorFormData({
      vendorName: "",
      companyName: "",
      mobileNumber: "",
      gstNumber: "",
      email: "",
      productCategory: "Other",
      notes: "",
    });
    setEditingVendor(null);
    setShowAddVendorForm(false);
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setVendorFormData({
      vendorName: String(vendor?.vendorName || ''),
      companyName: String(vendor?.companyName || ''),
      mobileNumber: String(vendor?.mobileNumber || ''),
      gstNumber: String(vendor?.gstNumber || ''),
      email: String(vendor?.email || ''),
      productCategory: String(vendor?.productCategory || 'Other'),
      notes: String(vendor?.notes || ''),
    });
    setShowAddVendorForm(true);
  };

  const handleAddVendor = async () => {
    const requiredFields = ["vendorName", "companyName", "mobileNumber", "gstNumber", "productCategory"];
    const hasEmptyRequiredField = requiredFields.some((field) => !String(vendorFormData[field] || "").trim());

    if (hasEmptyRequiredField) {
      alert("Please fill all required vendor fields.");
      return;
    }

    if (!/^\d{10}$/.test(String(vendorFormData.mobileNumber || "").trim())) {
      alert("Mobile number must be exactly 10 digits.");
      return;
    }

    const payload = {
      vendorName: String(vendorFormData.vendorName || "").trim(),
      companyName: String(vendorFormData.companyName || "").trim(),
      mobileNumber: String(vendorFormData.mobileNumber || "").trim(),
      gstNumber: String(vendorFormData.gstNumber || "").trim().toUpperCase(),
      email: String(vendorFormData.email || "").trim(),
      productCategory: String(vendorFormData.productCategory || "").trim(),
      notes: String(vendorFormData.notes || "").trim(),
    };

    try {
      let response = await apiFetch('/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response?.ok) {
        response = await apiFetch('/api/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await parseJsonOrThrow(response);

      if (!response?.ok || result?.success === false) {
        const fallbackError = Array.isArray(result?.errors)
          ? result.errors.map((entry) => entry?.msg).filter(Boolean).join(', ')
          : '';
        throw new Error(result?.message || fallbackError || 'Unable to add vendor');
      }

      const createdVendor = result?.data;
      if (createdVendor) {
        setVendors((prev) => [createdVendor, ...prev]);
      }

      alert('Vendor added successfully');
      resetVendorForm();
    } catch (error) {
      alert(error?.message || 'Unable to add vendor.');
    }
  };

  const handleUpdateVendor = async () => {
    if (!editingVendor) return;

    const requiredFields = ["vendorName", "companyName", "mobileNumber", "gstNumber", "productCategory"];
    const hasEmptyRequiredField = requiredFields.some((field) => !String(vendorFormData[field] || "").trim());

    if (hasEmptyRequiredField) {
      alert("Please fill all required vendor fields.");
      return;
    }

    if (!/^\d{10}$/.test(String(vendorFormData.mobileNumber || "").trim())) {
      alert("Mobile number must be exactly 10 digits.");
      return;
    }

    const payload = {
      vendorName: String(vendorFormData.vendorName || "").trim(),
      companyName: String(vendorFormData.companyName || "").trim(),
      mobileNumber: String(vendorFormData.mobileNumber || "").trim(),
      gstNumber: String(vendorFormData.gstNumber || "").trim().toUpperCase(),
      email: String(vendorFormData.email || "").trim(),
      productCategory: String(vendorFormData.productCategory || "").trim(),
      notes: String(vendorFormData.notes || "").trim(),
    };

    const vendorId = editingVendor?._id || editingVendor?.id;

    try {
      let response = await apiFetch(`/vendors/${encodeURIComponent(vendorId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response?.ok) {
        response = await apiFetch(`/api/vendors/${encodeURIComponent(vendorId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await parseJsonOrThrow(response);

      if (!response?.ok || result?.success === false) {
        const fallbackError = Array.isArray(result?.errors)
          ? result.errors.map((entry) => entry?.msg).filter(Boolean).join(', ')
          : '';
        throw new Error(result?.message || fallbackError || 'Unable to update vendor');
      }

      const updatedVendor = result?.data;
      if (updatedVendor) {
        setVendors((prev) => prev.map((vendor) => {
          const currentId = vendor?._id || vendor?.id;
          const updatedId = updatedVendor?._id || updatedVendor?.id;
          return String(currentId) === String(updatedId) ? updatedVendor : vendor;
        }));
      }

      alert('Vendor updated successfully');
      resetVendorForm();
    } catch (error) {
      alert(error?.message || 'Unable to update vendor.');
    }
  };

  const handleDeleteVendor = async (vendor) => {
    const vendorId = vendor?._id || vendor?.id;
    const vendorName = vendor?.vendorName || 'vendor';

    if (!window.confirm(`Are you sure you want to delete "${vendorName}"?`)) {
      return;
    }

    try {
      let response = await apiFetch(`/vendors/${encodeURIComponent(vendorId)}`, {
        method: 'DELETE',
      });

      if (!response?.ok) {
        response = await apiFetch(`/api/vendors/${encodeURIComponent(vendorId)}`, {
          method: 'DELETE',
        });
      }

      const result = await parseJsonOrThrow(response);

      if (!response?.ok || result?.success === false) {
        throw new Error(result?.message || 'Unable to delete vendor');
      }

      setVendors((prev) => prev.filter((entry) => {
        const entryId = entry?._id || entry?.id;
        return String(entryId) !== String(vendorId);
      }));
      alert('Vendor deleted successfully');
    } catch (error) {
      alert(error?.message || 'Unable to delete vendor.');
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

  const handleAddPayment = async (addPaymentFn) => {
    if (!paymentFormData.orderId || !paymentFormData.customerName || !paymentFormData.amount || !paymentFormData.method) {
      alert("Please fill all required fields");
      return;
    }

    const selectedOrd = enrichedOrders.find(o => o.id.toString() === paymentFormData.orderId);
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

    await addPaymentFn(newPayment);
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
      statusLabel: normalizeOrderStatus(order.status),
      invoiceDisplay: order.invoiceId || "No Invoice",
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

  const expenseTableData = useMemo(
    () => (expenses || []).map((expense) => ({
      ...expense,
      dateDisplay: expense?.date ? formatDate(expense.date) : 'N/A',
      totalExpenseValue: Number(expense?.total_expense || 0),
      transportation_loading: Number(expense?.transportation_loading || 0),
      shop_warehouse_expenses: Number(expense?.shop_warehouse_expenses || 0),
      staff_salary: Number(expense?.staff_salary || 0),
      damages_wastage: Number(expense?.damages_wastage || 0),
      financial_charges: Number(expense?.financial_charges || 0),
      taxes: Number(expense?.taxes || 0),
      other_charges: Number(expense?.other_charges || 0),
      notes: expense?.notes || '-',
    })),
    [expenses]
  );

  const vendorTableData = useMemo(
    () => (vendors || []).map((vendor) => ({
      ...vendor,
      emailDisplay: vendor?.email || 'N/A',
      createdDateDisplay: vendor?.created_at ? formatDate(vendor.created_at) : 'N/A',
    })),
    [vendors]
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
      accessorKey: "invoiceDisplay",
      header: "Invoice ID",
      Cell: ({ cell }) => <span className="invoice-id">{cell.getValue()}</span>
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
          {getStatusBadge(row.original.statusLabel || "Pending")}
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
            <option value="Confirmed">Confirmed</option>
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
            onChange={(e) => handleUpdatePaymentStatus(row.original, e.target.value)}
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

  const expenseColumns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'Expense ID',
      Cell: ({ cell }) => <strong>{cell.getValue()}</strong>,
    },
    { accessorKey: 'dateDisplay', header: 'Date' },
    {
      accessorKey: 'transportation_loading',
      header: 'Transport/Loading',
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'shop_warehouse_expenses',
      header: 'Shop/Warehouse',
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'staff_salary',
      header: 'Staff Salary',
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'damages_wastage',
      header: 'Damages/Wastage',
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'financial_charges',
      header: 'Financial Charges',
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'taxes',
      header: 'Taxes',
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'other_charges',
      header: 'Other Charges',
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'totalExpenseValue',
      header: 'Total Expense',
      Cell: ({ cell }) => <span className="amount">₹{Number(cell.getValue() || 0).toLocaleString()}</span>,
    },
    { accessorKey: 'notes', header: 'Notes' },
  ], []);

  const vendorColumns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'Vendor ID',
      Cell: ({ cell }) => <strong>{cell.getValue()}</strong>,
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor Name',
      Cell: ({ cell }) => <strong>{cell.getValue()}</strong>,
    },
    { accessorKey: 'companyName', header: 'Shop / Company' },
    { accessorKey: 'mobileNumber', header: 'Mobile Number' },
    { accessorKey: 'gstNumber', header: 'GST Number' },
    { accessorKey: 'emailDisplay', header: 'Email' },
    { accessorKey: 'productCategory', header: 'Product Category' },
    { accessorKey: 'notes', header: 'Notes' },
    { accessorKey: 'createdDateDisplay', header: 'Created On' },
    {
      accessorKey: 'actions',
      header: 'Actions',
      Cell: ({ row }) => (
        <div className="actions">
          <button
            className="btn-edit"
            onClick={() => handleEditVendor(row.original)}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className="btn-delete"
            onClick={() => handleDeleteVendor(row.original)}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      ),
    },
  ], [handleDeleteVendor]);


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
            className={activeTab === "vendors" ? "active" : ""}
            onClick={() => setActiveTab("vendors")}
          >
            Vendors
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
          <button
            className={activeTab === "expenses" ? "active" : ""}
            onClick={() => setActiveTab("expenses")}
          >
            Expenses
          </button>
          <button onClick={handleAdminHome}>
            Admin Home
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
            {activeTab === "vendors" && "Vendor Management Dashboard"}
            {activeTab === "stock" && "Stock Management Dashboard"}
            {activeTab === "pricing" && "Pricing Management"}
            {activeTab === "expenses" && "Expenses Management"}
          </h1>
          {(activeTab === "products" || activeTab === "stock") && productsLoading && (
            <div className="admin-alert">
              <strong>Loading:</strong> Syncing product data from MongoDB...
            </div>
          )}
          {(activeTab === "products" || activeTab === "stock") && productsError && (
            <div className="admin-alert warning">
              <strong>Product API Error:</strong> {productsError}
            </div>
          )}
          {activeTab === "orders" && ordersLoading && (
            <div className="admin-alert">
              <strong>Loading:</strong> Syncing order data from MongoDB...
            </div>
          )}
          {activeTab === "orders" && ordersError && (
            <div className="admin-alert warning">
              <strong>Order API Error:</strong> {ordersError}
            </div>
          )}
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
            {activeTab === "expenses" && (
              <>
                <div className="stat-card">
                  <span className="stat-label">Total Expenses</span>
                  <span className="stat-value">{expenses.length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Total Expense Amount</span>
                  <span className="stat-value warning">
                    ₹{expenses.reduce((sum, item) => sum + Number(item?.total_expense || 0), 0).toLocaleString()}
                  </span>
                </div>
              </>
            )}
            {activeTab === "vendors" && (
              <>
                <div className="stat-card">
                  <span className="stat-label">Total Vendors</span>
                  <span className="stat-value">{vendors.length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">With Email</span>
                  <span className="stat-value">{vendors.filter((vendor) => String(vendor?.email || '').trim()).length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">With GST Number</span>
                  <span className="stat-value success">{vendors.filter((vendor) => String(vendor?.gstNumber || '').trim()).length}</span>
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
              {productsLoading ? (
                <div className="empty-state">
                  <p>Loading products...</p>
                </div>
              ) : (
                <CommonTable
                  columns={productColumns}
                  data={productTableData}
                  fileName="products"
                />
              )}
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

        {/* Vendors Tab */}
        {activeTab === "vendors" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Vendor Directory</h2>
              {!showAddVendorForm && (
                <button className="btn-add" onClick={() => setShowAddVendorForm(true)}>
                  ➕ Add Vendor
                </button>
              )}
            </div>

            {showAddVendorForm && (
              <div className="product-form-card">
                <h3>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Vendor Name *</label>
                    <input
                      type="text"
                      name="vendorName"
                      value={vendorFormData.vendorName}
                      onChange={handleVendorInputChange}
                      placeholder="Vendor full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Shop / Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={vendorFormData.companyName}
                      onChange={handleVendorInputChange}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={vendorFormData.mobileNumber}
                      onChange={handleVendorInputChange}
                      placeholder="10 digit number"
                      maxLength={10}
                    />
                  </div>
                  <div className="form-group">
                    <label>GST Number *</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={vendorFormData.gstNumber}
                      onChange={handleVendorInputChange}
                      placeholder="GSTIN"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email ID (Optional)</label>
                    <input
                      type="email"
                      name="email"
                      value={vendorFormData.email}
                      onChange={handleVendorInputChange}
                      placeholder="vendor@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Product Category *</label>
                    <select
                      name="productCategory"
                      value={vendorFormData.productCategory}
                      onChange={handleVendorInputChange}
                    >
                      {vendorCategoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={vendorFormData.notes}
                      onChange={handleVendorInputChange}
                      rows="3"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  {editingVendor ? (
                    <button className="btn-update" onClick={handleUpdateVendor}>
                      💾 Update Vendor
                    </button>
                  ) : (
                    <button className="btn-save" onClick={handleAddVendor}>
                      ✅ Save Vendor
                    </button>
                  )}
                  <button className="btn-cancel" onClick={resetVendorForm}>
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}

            {vendorsError && (
              <div className="admin-alert warning" style={{ marginBottom: '12px' }}>
                <strong>Vendor API Error:</strong> {vendorsError}
              </div>
            )}

            <div className="products-table">
              {vendorsLoading ? (
                <div className="empty-state">
                  <p>Loading vendors...</p>
                </div>
              ) : (
                <CommonTable columns={vendorColumns} data={vendorTableData} fileName="vendors" />
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
                    onClick={() => openStockModal(product)}
                  >
                    📝 Update Stock
                  </button>
                </div>
              ))}
            </div>

            {showStockModal && selectedStockProduct && (
              <div className="modal-overlay stock-modal-overlay" onClick={closeStockModal}>
                <div className="modal-content stock-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="stock-modal-header">
                    <div className="stock-modal-title">
                      <span className="stock-icon">📦</span>
                      <div>
                        <h2>Update Stock</h2>
                        <p className="product-name-subtitle">{selectedStockProduct.name}</p>
                      </div>
                    </div>
                    <button className="modal-close" onClick={closeStockModal}>×</button>
                  </div>

                  <div className="stock-modal-body">
                    <div className="current-stock-card">
                      <div className="stock-stat">
                        <span className="stat-label">Current Stock</span>
                        <span className="stat-value primary">{Number(selectedStockProduct.stock || 0)}</span>
                      </div>
                      <div className="stock-stat">
                        <span className="stat-label">Current Avg Price</span>
                        <span className="stat-value">₹{Number(selectedStockProduct.purchaseCost ?? selectedStockProduct.wholesalePrice ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="stock-stat">
                        <span className="stat-label">Unit</span>
                        <span className="stat-value accent">{selectedStockProduct.unit || "unit"}</span>
                      </div>
                    </div>

                    <div className="stock-update-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>
                            New Stock Qty
                            <span className="required">*</span>
                          </label>
                          <div className="input-with-unit">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              name="stock"
                              value={stockFormData.stock}
                              onChange={handleStockFormChange}
                              placeholder="Enter stock"
                            />
                            <span className="unit-label">{selectedStockProduct.unit || "unit"}</span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>
                            New Purchase Price
                            <span className="required">*</span>
                          </label>
                          <div className="input-with-unit">
                            <span className="currency-symbol">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              name="purchasePrice"
                              value={stockFormData.purchasePrice}
                              onChange={handleStockFormChange}
                              placeholder="Enter purchase price"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="stock-preview-card">
                        <h4>Live Preview</h4>
                        <div className="preview-grid">
                          <div className="preview-item">
                            <span className="preview-label">Updated Stock</span>
                            <span className="preview-value highlight">
                              {previewStock}
                            </span>
                          </div>
                          <div className="preview-item">
                            <span className="preview-label">Added Qty</span>
                            <span className="preview-value accent">{previewAddedQty}</span>
                          </div>
                          <div className="preview-item">
                            <span className="preview-label">Final Avg Purchase</span>
                            <span className="preview-value success">
                              ₹{previewWeightedAvg.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="stock-modal-actions">
                        <button className="btn-cancel" onClick={closeStockModal}>
                          Cancel
                        </button>
                        <button className="btn-update-stock" onClick={handleStockUpdate}>
                          ✅ Update Stock & Price
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Expense Management</h2>
              {!showAddExpenseForm && (
                <button className="btn-add" onClick={() => setShowAddExpenseForm(true)}>
                  ➕ Add Expense
                </button>
              )}
            </div>

            {showAddExpenseForm && (
              <div className="product-form-card">
                <h3>Add Expense</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Date *</label>
                    <input type="date" name="date" value={expenseFormData.date} onChange={handleExpenseInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Transportation/Loading *</label>
                    <input type="number" min="0" step="0.01" name="transportation_loading" value={expenseFormData.transportation_loading} onChange={handleExpenseInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Shop/Warehouse Expenses *</label>
                    <input type="number" min="0" step="0.01" name="shop_warehouse_expenses" value={expenseFormData.shop_warehouse_expenses} onChange={handleExpenseInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Staff Salary *</label>
                    <input type="number" min="0" step="0.01" name="staff_salary" value={expenseFormData.staff_salary} onChange={handleExpenseInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Damages/Wastage *</label>
                    <input type="number" min="0" step="0.01" name="damages_wastage" value={expenseFormData.damages_wastage} onChange={handleExpenseInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Financial Charges *</label>
                    <input type="number" min="0" step="0.01" name="financial_charges" value={expenseFormData.financial_charges} onChange={handleExpenseInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Taxes *</label>
                    <input type="number" min="0" step="0.01" name="taxes" value={expenseFormData.taxes} onChange={handleExpenseInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Other Charges *</label>
                    <input type="number" min="0" step="0.01" name="other_charges" value={expenseFormData.other_charges} onChange={handleExpenseInputChange} />
                  </div>
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea name="notes" value={expenseFormData.notes} onChange={handleExpenseInputChange} rows="3" placeholder="Optional notes" />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleAddExpense}>
                    ✅ Save Expense
                  </button>
                  <button className="btn-cancel" onClick={resetExpenseForm}>
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}

            {expensesError && (
              <div className="admin-alert warning" style={{ marginBottom: '12px' }}>
                <strong>Expense API Error:</strong> {expensesError}
              </div>
            )}

            <div className="products-table">
              {expensesLoading ? (
                <div className="empty-state">
                  <p>Loading expenses...</p>
                </div>
              ) : (
                <CommonTable columns={expenseColumns} data={expenseTableData} fileName="expenses" />
              )}
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
                  Pending ({enrichedOrders.filter(o => normalizeOrderStatus(o.status) === "Pending").length})
                </button>
                <button 
                  className={statusFilter === "Processing" ? "active" : ""} 
                  onClick={() => setStatusFilter("Processing")}
                >
                  Processing ({enrichedOrders.filter(o => normalizeOrderStatus(o.status) === "Processing").length})
                </button>
                <button 
                  className={statusFilter === "Delivered" ? "active" : ""} 
                  onClick={() => setStatusFilter("Delivered")}
                >
                  Delivered ({enrichedOrders.filter(o => normalizeOrderStatus(o.status) === "Delivered").length})
                </button>
                <button
                  className={statusFilter === "Confirmed" ? "active" : ""}
                  onClick={() => setStatusFilter("Confirmed")}
                >
                  Confirmed ({enrichedOrders.filter(o => normalizeOrderStatus(o.status) === "Confirmed").length})
                </button>
                <button 
                  className={statusFilter === "Cancelled" ? "active" : ""} 
                  onClick={() => setStatusFilter("Cancelled")}
                >
                  Cancelled ({enrichedOrders.filter(o => normalizeOrderStatus(o.status) === "Cancelled").length})
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
                          <span className="label">Transaction ID:</span>
                          <span className="value">{selectedOrder.transactionId || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Invoice ID:</span>
                          <span className="value" style={{ fontWeight: 600, color: '#2563eb' }}>
                            {selectedOrder.invoiceId || "No Invoice Generated Yet"}
                          </span>
                        </div>
                        {selectedOrder.invoiceGeneratedAt && (
                          <div className="detail-item">
                            <span className="label">Invoice Generated:</span>
                            <span className="value">{formatDateTime(selectedOrder.invoiceGeneratedAt)}</span>
                          </div>
                        )}
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
                      {enrichedOrders.map(order => (
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