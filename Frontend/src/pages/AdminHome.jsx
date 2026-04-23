import { useNavigate } from "react-router-dom";
import { useState, useContext, useMemo, useEffect, useRef } from "react";
import { OrderContext } from "../context/OrderContext";
import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext";
import { UserContext } from "../context/UserContext";
import { NotificationContext } from "../context/NotificationContext";
import CommonTable from "../components/CommonTable";
import { apiFetch } from "../utils/apiFetch";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const toMoney = (value) => Number(Number(value || 0).toFixed(2));

const parseJsonOrThrow = async (response) => {
  const contentType = response?.headers?.get?.("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("API returned non-JSON response");
  }
  return response.json();
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDateInputValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateValue = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfLocalDay = (date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const endOfLocalDay = (date) => {
  const day = new Date(date);
  day.setHours(23, 59, 59, 999);
  return day;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatDateRangeLabel = (startDate, endDate) => {
  if (!startDate || !endDate) return "Custom Range";

  return `${startDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} - ${endDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
};

function AdminHome() {
  const navigate = useNavigate();
  const [adminUsername] = useState(localStorage.getItem("adminUsername") || "Admin");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(() => toDateInputValue(addDays(new Date(), -6)));
  const [customEndDate, setCustomEndDate] = useState(() => toDateInputValue(new Date()));
  const notificationPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const analyticsSectionRef = useRef(null);
  const { orders } = useContext(OrderContext);
  const { products } = useContext(ProductContext);
  const { cart } = useContext(CartContext);
  const { user } = useContext(UserContext);
  const [range, setRange] = useState("7d");
  const [expenses, setExpenses] = useState([]);
  const {
    notifications,
    markNotificationRead,
    clearNotifications,
    unreadCount,
  } = useContext(NotificationContext);

  // Calculate stats
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const activeUsers = user ? 1 : 0; // Count of logged in users
    const productCostById = new Map();
    const productCostByName = new Map();

    products.forEach((product) => {
      const unitCost = Number(product?.purchaseCost ?? product?.purchasePrice ?? product?.wholesalePrice ?? product?.price ?? 0);
      const idKey = String(product?.id || product?._id || "").trim().toLowerCase();
      const nameKey = String(product?.name || "").trim().toLowerCase();
      if (idKey) productCostById.set(idKey, unitCost);
      if (nameKey) productCostByName.set(nameKey, unitCost);
    });

    const grossProfit = orders.reduce((sum, order) => {
      const items = Array.isArray(order?.items) ? order.items : [];
      const orderRevenue = Number(order?.total || order?.finalPayableAmount || 0);

      const costFromItems = items.reduce((itemSum, item) => {
        const qty = Number(item?.quantity || 1);
        const idKey = String(item?.id || item?._id || item?.productId || "").trim().toLowerCase();
        const nameKey = String(item?.name || "").trim().toLowerCase();

        const unitCost =
          productCostById.get(idKey) ??
          productCostByName.get(nameKey) ??
          Number(item?.purchasePrice ?? item?.costPrice ?? item?.wholesalePrice ?? item?.price ?? 0);

        return itemSum + (Number.isFinite(unitCost) ? unitCost : 0) * qty;
      }, 0);

      const effectiveOrderCost = items.length > 0 ? costFromItems : orderRevenue;
      return sum + (orderRevenue - effectiveOrderCost);
    }, 0);

    const totalExpenses = (expenses || []).reduce((sum, expense) => {
      if (Number.isFinite(Number(expense?.total_expense))) {
        return sum + Number(expense.total_expense);
      }

      const fallbackTotal =
        Number(expense?.transportation_loading || 0) +
        Number(expense?.shop_warehouse_expenses || 0) +
        Number(expense?.staff_salary || 0) +
        Number(expense?.damages_wastage || 0) +
        Number(expense?.financial_charges || 0) +
        Number(expense?.taxes || 0) +
        Number(expense?.other_charges || 0);
      return sum + fallbackTotal;
    }, 0);

    const netProfit = grossProfit - totalExpenses;
    
    return { totalOrders, totalRevenue, activeUsers, grossProfit, totalExpenses, netProfit };
  }, [orders, user, products, expenses]);

  const analyticsColors = ["#667eea", "#764ba2", "#28a745", "#ff9f43", "#e74c3c", "#17a2b8"];

  const dateWindow = useMemo(() => {
    const now = new Date();

    if (range === "7d") {
      return {
        start: startOfLocalDay(addDays(now, -6)),
        end: endOfLocalDay(now),
      };
    }

    if (range === "30d") {
      return {
        start: startOfLocalDay(addDays(now, -29)),
        end: endOfLocalDay(now),
      };
    }

    if (range === "custom") {
      const start = parseDateValue(customStartDate);
      const end = parseDateValue(customEndDate);

      if (!start || !end) {
        return { start: null, end: null };
      }

      const startDate = start <= end ? start : end;
      const endDate = start <= end ? end : start;

      return {
        start: startOfLocalDay(startDate),
        end: endOfLocalDay(endDate),
      };
    }

    return { start: null, end: null };
  }, [range, customStartDate, customEndDate]);

  const selectedRangeLabel = useMemo(() => {
    if (range === "7d") return "Last 7 days";
    if (range === "30d") return "Last 30 days";
    if (range === "custom") return formatDateRangeLabel(dateWindow.start, dateWindow.end);
    return "All time";
  }, [range, dateWindow.start, dateWindow.end]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const orderDate = parseDateValue(order?.date);
        if (!orderDate) return false;
        if (range === "custom" && (!dateWindow.start || !dateWindow.end)) return false;
        if (!dateWindow.start || !dateWindow.end) return true;
        return orderDate >= dateWindow.start && orderDate <= dateWindow.end;
      }),
    [orders, dateWindow.start, dateWindow.end, range]
  );

  const prevFilteredOrders = useMemo(() => {
    if (range === "all" || !dateWindow.start || !dateWindow.end) return [];

    const days = Math.max(1, Math.round((dateWindow.end.getTime() - dateWindow.start.getTime()) / MS_PER_DAY) + 1);
    const endPrev = endOfLocalDay(addDays(dateWindow.start, -1));
    const startPrev = startOfLocalDay(addDays(endPrev, -(days - 1)));

    return orders.filter((order) => {
      const orderDate = parseDateValue(order?.date);
      return !!orderDate && orderDate >= startPrev && orderDate <= endPrev;
    });
  }, [orders, dateWindow.end, dateWindow.start, range]);

  const normalizedExpenses = useMemo(
    () =>
      (expenses || []).map((expense) => {
        const fallbackTotal =
          Number(expense?.transportation_loading || 0) +
          Number(expense?.shop_warehouse_expenses || 0) +
          Number(expense?.staff_salary || 0) +
          Number(expense?.damages_wastage || 0) +
          Number(expense?.financial_charges || 0) +
          Number(expense?.taxes || 0) +
          Number(expense?.other_charges || 0);

        return {
          ...expense,
          parsedDate: new Date(expense?.date || expense?.created_at || Date.now()),
          totalExpenseValue: Number.isFinite(Number(expense?.total_expense))
            ? Number(expense.total_expense)
            : fallbackTotal,
        };
      }),
    [expenses]
  );

  const filteredExpenses = useMemo(
    () =>
      normalizedExpenses.filter((expense) => {
        if (range === "custom" && (!dateWindow.start || !dateWindow.end)) return false;
        if (!dateWindow.start || !dateWindow.end) return true;
        return expense.parsedDate >= dateWindow.start && expense.parsedDate <= dateWindow.end;
      }),
    [normalizedExpenses, dateWindow.start, dateWindow.end, range]
  );

  const prevFilteredExpenses = useMemo(() => {
    if (range === "all" || !dateWindow.start || !dateWindow.end) return [];

    const days = Math.max(1, Math.round((dateWindow.end.getTime() - dateWindow.start.getTime()) / MS_PER_DAY) + 1);
    const endPrev = endOfLocalDay(addDays(dateWindow.start, -1));
    const startPrev = startOfLocalDay(addDays(endPrev, -(days - 1)));

    return normalizedExpenses.filter((expense) => expense.parsedDate >= startPrev && expense.parsedDate <= endPrev);
  }, [normalizedExpenses, dateWindow.end, dateWindow.start, range]);

  const analytics = useMemo(() => {
    const list = [...filteredOrders].sort((left, right) => {
      const leftDate = parseDateValue(left?.date)?.getTime() || 0;
      const rightDate = parseDateValue(right?.date)?.getTime() || 0;
      return rightDate - leftDate;
    });
    const totalOrders = list.length;
    const totalRevenue = list.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const productCostById = new Map();
    const productCostByName = new Map();

    products.forEach((product) => {
      const unitCost = Number(product?.purchaseCost ?? product?.purchasePrice ?? product?.wholesalePrice ?? product?.price ?? 0);
      const idKey = String(product?.id || product?._id || "").trim().toLowerCase();
      const nameKey = String(product?.name || "").trim().toLowerCase();
      if (idKey) productCostById.set(idKey, unitCost);
      if (nameKey) productCostByName.set(nameKey, unitCost);
    });

    const ordersByCategory = {};
    products.forEach((product) => {
      if (!ordersByCategory[product.category]) {
        ordersByCategory[product.category] = 0;
      }
    });

    list.forEach((order) => {
      order.items.forEach((item) => {
        const qty = Number(item.quantity || 1);
        const product = products.find((p) => p.id === item.id);
        const category = product?.category || item.category;
        if (category && ordersByCategory[category] !== undefined) {
          ordersByCategory[category] += qty;
        }
      });
    });

    const productSales = {};
    const productRevenue = {};
    let totalCost = 0;
    let profitableOrders = 0;
    let lossOrders = 0;
    const daysMap = new Map();

    list.forEach((order) => {
      const items = Array.isArray(order?.items) ? order.items : [];
      const orderRevenue = Number(order.total || 0);
      const orderDate = parseDateValue(order?.date) || new Date();
      const orderCost = items.reduce((itemCostSum, item) => {
        const qty = Number(item.quantity || 1);
        const idKey = String(item?.id || item?._id || item?.productId || "").trim().toLowerCase();
        const nameKey = String(item?.name || "").trim().toLowerCase();
        const unitCost =
          productCostById.get(idKey) ??
          productCostByName.get(nameKey) ??
          Number(item?.purchasePrice ?? item?.costPrice ?? item?.wholesalePrice ?? item?.price ?? 0);

        return itemCostSum + (Number.isFinite(unitCost) ? unitCost : 0) * qty;
      }, 0);

      const effectiveOrderCost = items.length > 0 ? orderCost : orderRevenue;
      const orderProfit = orderRevenue - effectiveOrderCost;
      totalCost += effectiveOrderCost;
      if (orderProfit >= 0) {
        profitableOrders += 1;
      } else {
        lossOrders += 1;
      }

      const dateKey = orderDate.toISOString().slice(0, 10);
      const dateLabel = orderDate.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
      const previousEntry = daysMap.get(dateKey) || { date: dateLabel, sortKey: orderDate.getTime(), revenue: 0, cost: 0, profit: 0, orders: 0 };
      previousEntry.revenue += orderRevenue;
      previousEntry.cost += effectiveOrderCost;
      previousEntry.profit += orderProfit;
      previousEntry.orders += 1;
      daysMap.set(dateKey, previousEntry);

      order.items.forEach((item) => {
        const key = item.id ?? item.name;
        const qty = Number(item.quantity || 1);
        const unitPrice = Number(item.price || 0);
        const revenue = unitPrice * qty;

        productSales[key] = (productSales[key] || 0) + qty;
        productRevenue[key] = (productRevenue[key] || 0) + revenue;
      });
    });

    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.totalExpenseValue || 0), 0);
    const prevExpenses = prevFilteredExpenses.reduce((sum, expense) => sum + Number(expense.totalExpenseValue || 0), 0);

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses;
    const netLoss = netProfit < 0 ? Math.abs(netProfit) : 0;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const topProducts = Object.entries(productSales)
      .map(([key, units]) => {
        const name = products.find((p) => p.id === Number(key))?.name || key;
        return { name, units, revenue: productRevenue[key] || 0 };
      })
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const recentOrders = list.slice(0, 10);

    const prevRevenue = prevFilteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const prevOrders = prevFilteredOrders.length;
    const prevGrossProfit = prevFilteredOrders.reduce((sum, order) => {
      const items = Array.isArray(order?.items) ? order.items : [];
      const orderRevenue = Number(order?.total || 0);
      const orderCost = items.reduce((itemCostSum, item) => {
        const qty = Number(item.quantity || 1);
        const idKey = String(item?.id || item?._id || item?.productId || "").trim().toLowerCase();
        const nameKey = String(item?.name || "").trim().toLowerCase();
        const unitCost =
          productCostById.get(idKey) ??
          productCostByName.get(nameKey) ??
          Number(item?.purchasePrice ?? item?.costPrice ?? item?.wholesalePrice ?? item?.price ?? 0);
        return itemCostSum + (Number.isFinite(unitCost) ? unitCost : 0) * qty;
      }, 0);
      const effectiveOrderCost = items.length > 0 ? orderCost : orderRevenue;
      return sum + (orderRevenue - effectiveOrderCost);
    }, 0);

    const prevNetProfit = prevGrossProfit - prevExpenses;

    const revDeltaPct = prevRevenue === 0 ? 100 : ((totalRevenue - prevRevenue) / prevRevenue) * 100;
    const ordDeltaPct = prevOrders === 0 ? 100 : ((totalOrders - prevOrders) / prevOrders) * 100;
    const netDeltaPct = prevNetProfit === 0 ? 100 : ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      totalCost,
      totalExpenses,
      grossProfit,
      netProfit,
      netLoss,
      grossMargin,
      netMargin,
      profitableOrders,
      lossOrders,
      ordersByCategory,
      topProducts,
      recentOrders,
      totalProducts: products.length,
      cartItems: cart.length,
      dailySeries: Array.from(daysMap.values())
        .sort((left, right) => left.sortKey - right.sortKey)
        .map((entry) => ({
          ...entry,
          revenue: toMoney(entry.revenue),
          cost: toMoney(entry.cost),
          profit: toMoney(entry.profit),
        })),
      revDeltaPct,
      ordDeltaPct,
      netDeltaPct,
    };
  }, [filteredOrders, prevFilteredOrders, filteredExpenses, prevFilteredExpenses, products, cart]);

  useEffect(() => {
    let isMounted = true;

    const loadExpenses = async () => {
      try {
        let response = await apiFetch("/expenses", { method: "GET" });
        if (!response?.ok) {
          response = await apiFetch("/api/expenses", { method: "GET" });
        }

        if (!response?.ok) {
          throw new Error("Unable to load expenses");
        }

        const payload = await parseJsonOrThrow(response);
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        if (isMounted) {
          setExpenses(rows);
        }
      } catch {
        if (isMounted) {
          setExpenses([]);
        }
      }
    };

    loadExpenses();

    return () => {
      isMounted = false;
    };
  }, []);

  const topProductsColumns = useMemo(() => [
    { accessorKey: "name", header: "Product Name" },
    { accessorKey: "units", header: "Units Sold" },
    {
      accessorKey: "revenue",
      header: "Revenue",
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toFixed(2)}`,
    },
  ], []);

  const topProductsData = useMemo(
    () => analytics.topProducts.map((product) => ({ ...product })),
    [analytics.topProducts]
  );

  const recentOrdersColumns = useMemo(() => [
    {
      accessorKey: "id",
      header: "Order ID",
      Cell: ({ cell }) => `#${cell.getValue()}`,
    },
    { accessorKey: "dateDisplay", header: "Date" },
    { accessorKey: "itemsCount", header: "Items" },
    {
      accessorKey: "totalValue",
      header: "Total",
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toFixed(2)}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      Cell: ({ row }) => <span className="status-badge confirmed">{row.original.status}</span>,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      Cell: ({ row }) => <span className="status-badge paid">{row.original.paymentStatus}</span>,
    },
  ], []);

  const recentOrdersData = useMemo(
    () => analytics.recentOrders.map((order) => ({
      ...order,
      dateDisplay: new Date(order.date).toLocaleDateString(),
      itemsCount: order.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
      totalValue: order.total || 0,
      status: order.status || "Confirmed",
      paymentStatus: order.paymentStatus || "Completed",
    })),
    [analytics.recentOrders]
  );

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUsername");
    navigate("/home");
  };

  const toggleNotifications = () => {
    setNotificationsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!notificationsOpen) return;

    const handleOutsideClick = (event) => {
      const panel = notificationPanelRef.current;
      const button = notificationButtonRef.current;

      if (!panel || !button) return;
      if (panel.contains(event.target) || button.contains(event.target)) return;

      setNotificationsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notificationsOpen]);

  const formatNotificationMeta = (notification) => {
    const meta = notification?.meta || {};
    const parts = [];

    if (meta.name) parts.push(meta.name);
    if (meta.email) parts.push(meta.email);
    if (meta.phone) parts.push(meta.phone);
    if (meta.topic) parts.push(`Topic: ${meta.topic}`);
    if (meta.customer) parts.push(`Customer: ${meta.customer}`);
    if (meta.items != null) parts.push(`Items: ${meta.items}`);
    if (meta.total != null) parts.push(`Total: ₹${Number(meta.total).toFixed(2)}`);
    if (meta.product) parts.push(`Product: ${meta.product}`);
    if (meta.stock != null) parts.push(`Stock: ${meta.stock}`);

    return parts.join(" | ");
  };

  const getNotificationIcon = (type) => {
    if (type === "contact") return "✉️";
    if (type === "order") return "🧾";
    if (type === "stock") return "📦";
    return "🔔";
  };

  const handleExportAnalyticsPdf = async () => {
    if (exportingPdf) return;

    const analyticsNode = analyticsSectionRef.current;
    if (!analyticsNode) {
      alert("Analytics section not available for export.");
      return;
    }

    setExportingPdf(true);

    try {
      const generatedAt = new Date();
      const dateStamp = generatedAt.toISOString().slice(0, 10);
      const rangeLabel = selectedRangeLabel;
      const generatedAtLabel = generatedAt.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const canvas = await html2canvas(analyticsNode, {
        backgroundColor: "#f5f7fa",
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        ignoreElements: (element) => element?.classList?.contains("no-pdf"),
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const headerHeight = 24;
      const footerHeight = 8;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin - headerHeight - footerHeight;
      const imageHeight = (canvas.height * printableWidth) / canvas.width;
      const totalPages = Math.max(1, Math.ceil(imageHeight / printableHeight));

      const drawHeader = () => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text("Wholesale Store - Admin Analytics Report", margin, margin + 6);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text(`Range: ${rangeLabel}`, margin, margin + 12);
        pdf.text(`Generated At: ${generatedAtLabel}`, margin, margin + 17);
        pdf.text(`Generated By: ${adminUsername}`, margin, margin + 22);

        pdf.setDrawColor(210, 210, 210);
        pdf.line(margin, margin + headerHeight, pageWidth - margin, margin + headerHeight);
      };

      const drawFooter = (pageIndex) => {
        const pageText = `Page ${pageIndex + 1} of ${totalPages}`;
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin, pageHeight - margin - footerHeight + 1, pageWidth - margin, pageHeight - margin - footerHeight + 1);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(pageText, pageWidth - margin, pageHeight - margin - 1, { align: "right" });
        pdf.setTextColor(0, 0, 0);
      };

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        drawHeader();
        const imageY = margin + headerHeight - pageIndex * printableHeight;
        pdf.addImage(imageData, "PNG", margin, imageY, printableWidth, imageHeight, undefined, "FAST");
        drawFooter(pageIndex);
      }

      pdf.save(`admin-analytics-${range}-${dateStamp}.pdf`);
    } catch (error) {
      alert(error?.message || "Unable to export analytics PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="admin-home-container">
      {/* Header */}
      <div className="admin-home-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🏢 Wholesale Store Admin</h1>
            <p className="welcome-msg">Welcome back, <strong>{adminUsername}</strong>!</p>
          </div>
          <div className="header-right">
            <div className="admin-notifications-wrap">
              <button
                className={`admin-header-icon-btn ${notificationsOpen ? "is-active" : ""}`}
                onClick={toggleNotifications}
                type="button"
                aria-label="Toggle contact messages"
                aria-expanded={notificationsOpen}
                ref={notificationButtonRef}
              >
                <span aria-hidden="true">🔔</span>
                {unreadCount > 0 && (
                  <span className="admin-header-badge">{unreadCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="admin-notifications admin-notifications--open"
                  ref={notificationPanelRef}
                >
                  <div className="admin-notifications__header">
                    <div className="admin-notifications__title">
                      <span className="admin-notifications__title-icon" aria-hidden="true">🔔</span>
                      <h3>Contact messages</h3>
                    </div>
                    <div className="admin-notifications__actions">
                      <span className="admin-notifications__count">{unreadCount} unread</span>
                      <button
                        className="admin-notifications__clear"
                        onClick={clearNotifications}
                        disabled={notifications.length === 0}
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="admin-notifications__empty">No contact messages yet.</p>
                  ) : (
                    <div className="admin-notifications__list">
                      {notifications.map((notification) => {
                        const metaLine = formatNotificationMeta(notification);

                        return (
                          <div
                            key={notification.id}
                            className={`admin-notification ${notification.read ? "is-read" : ""}`}
                          >
                            <div className="admin-notification__icon" aria-hidden="true">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="admin-notification__title-row">
                              <h4>{notification.title}</h4>
                              <span>{new Date(notification.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="admin-notification__message">{notification.message}</p>
                            {metaLine && (
                              <p className="admin-notification__meta">{metaLine}</p>
                            )}
                            {!notification.read && (
                              <button
                                className="admin-notification__mark"
                                onClick={() => markNotificationRead(notification.id)}
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="btn-logout">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-home-content">
        <div className="home-intro">
          <h2>Admin Dashboard Menu</h2>
          <p>Choose what you'd like to manage today</p>
        </div>

        {/* Navigation Cards */}
        <div className="admin-cards-grid">
          {/* Dashboard Card */}
          <div className="admin-menu-card" onClick={() => navigate("/admin-dashboard")}>
            <div className="card-icon">📊</div>
            <h3>Dashboard</h3>
            <p>View store overview, inventory, and quick stats</p>
            <button className="btn-navigate">Go to Dashboard →</button>
          </div>

          {/* Analytics Card */}
          <div
            className="admin-menu-card"
            onClick={() => analyticsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <div className="card-icon">📈</div>
            <h3>Analytics</h3>
            <p>Detailed reports, sales trends, and performance metrics right below</p>
            <button className="btn-navigate">View Analytics ↓</button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="admin-home-stats">
          <h3>Quick Overview</h3>
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.totalOrders}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Active Users</div>
              <div className="stat-value">{stats.activeUsers}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Gross Profit / Loss</div>
              <div className={`stat-value ${stats.grossProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
                {stats.grossProfit >= 0 ? "+" : "-"}₹{Math.abs(stats.grossProfit).toLocaleString()}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value profit-negative">
                -₹{Math.abs(stats.totalExpenses).toLocaleString()}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Net Profit / Loss (After Expenses)</div>
              <div className={`stat-value ${stats.netProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
                {stats.netProfit >= 0 ? "+" : "-"}₹{Math.abs(stats.netProfit).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-section admin-analytics" id="admin-home-analytics" ref={analyticsSectionRef}>
          <div className="analytics-header">
            <h2>Admin Analytics</h2>
            <div className="filter-bar">
              <span>Range:</span>
              <button className={`filter-btn ${range === "7d" ? "active" : ""}`} onClick={() => setRange("7d")}>7 Days</button>
              <button className={`filter-btn ${range === "30d" ? "active" : ""}`} onClick={() => setRange("30d")}>30 Days</button>
              <button className={`filter-btn ${range === "custom" ? "active" : ""}`} onClick={() => setRange("custom")}>Date Wise</button>
              <button className={`filter-btn ${range === "all" ? "active" : ""}`} onClick={() => setRange("all")}>All Time</button>
              <button
                className="filter-btn export-pdf-btn no-pdf"
                onClick={handleExportAnalyticsPdf}
                disabled={exportingPdf}
              >
                {exportingPdf ? "Exporting..." : "Export PDF"}
              </button>
            </div>
          </div>

          {range === "custom" && (
            <div className="date-range-picker no-pdf">
              <div className="date-range-field">
                <label htmlFor="admin-analytics-start-date">From</label>
                <input
                  id="admin-analytics-start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                />
              </div>
              <div className="date-range-field">
                <label htmlFor="admin-analytics-end-date">To</label>
                <input
                  id="admin-analytics-end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                />
              </div>
              <div className="date-range-summary">
                <span>Selected:</span>
                <strong>{selectedRangeLabel}</strong>
              </div>
            </div>
          )}

          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">🛒</div>
              <div className="kpi-content">
                <h4>Total Orders</h4>
                <p className="kpi-value">{analytics.totalOrders}</p>
                <span className={`trend ${analytics.ordDeltaPct >= 0 ? "up" : "down"}`}>
                  {analytics.ordDeltaPct >= 0 ? "▲" : "▼"} {Math.abs(analytics.ordDeltaPct).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">💰</div>
              <div className="kpi-content">
                <h4>Total Revenue</h4>
                <p className="kpi-value">₹{analytics.totalRevenue.toFixed(2)}</p>
                <span className={`trend ${analytics.revDeltaPct >= 0 ? "up" : "down"}`}>
                  {analytics.revDeltaPct >= 0 ? "▲" : "▼"} {Math.abs(analytics.revDeltaPct).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">📉</div>
              <div className="kpi-content">
                <h4>Gross Profit / Loss</h4>
                <p className={`kpi-value ${analytics.grossProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
                  {analytics.grossProfit >= 0 ? "+" : "-"}₹{Math.abs(analytics.grossProfit).toFixed(2)}
                </p>
                <span className={`trend ${analytics.grossMargin >= 0 ? "up" : "down"}`}>
                  Margin {analytics.grossMargin >= 0 ? "▲" : "▼"} {Math.abs(analytics.grossMargin).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">📦</div>
              <div className="kpi-content">
                <h4>Avg Order Value</h4>
                <p className="kpi-value">₹{analytics.averageOrderValue.toFixed(2)}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">🧾</div>
              <div className="kpi-content">
                <h4>Total Expenses</h4>
                <p className="kpi-value profit-negative">₹{analytics.totalExpenses.toFixed(2)}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">⚖️</div>
              <div className="kpi-content">
                <h4>Net Profit / Loss</h4>
                <p className={`kpi-value ${analytics.netProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
                  {analytics.netProfit >= 0 ? "+" : "-"}₹{Math.abs(analytics.netProfit).toFixed(2)}
                </p>
                <span className={`trend ${analytics.netMargin >= 0 ? "up" : "down"}`}>
                  Margin {analytics.netMargin >= 0 ? "▲" : "▼"} {Math.abs(analytics.netMargin).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">📚</div>
              <div className="kpi-content">
                <h4>Total Products</h4>
                <p className="kpi-value">{analytics.totalProducts}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">🛍️</div>
              <div className="kpi-content">
                <h4>Active Cart Items</h4>
                <p className="kpi-value">{analytics.cartItems}</p>
              </div>
            </div>
          </div>

          <div className="chart-grid">
            <div className="analytics-card">
              <h3>Revenue & Orders Trend</h3>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={analytics.dailySeries} margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6c757d" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6c757d" />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} iconType="line" />
                    <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#667eea" strokeWidth={3} dot={{ fill: "#667eea", r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="orders" name="Orders" stroke="#ff9f43" strokeWidth={3} dot={{ fill: "#ff9f43", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-card">
              <h3>Sales by Category</h3>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.ordersByCategory).map(([name, value]) => ({ name, value }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {Object.entries(analytics.ordersByCategory).map((_, idx) => (
                        <Cell key={idx} fill={analyticsColors[idx % analyticsColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-card">
              <h3>Gross Profit vs Cost Trend</h3>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={analytics.dailySeries} margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6c757d" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6c757d" />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} iconType="line" />
                    <Line type="monotone" dataKey="cost" name="Cost (₹)" stroke="#ef4444" strokeWidth={3} dot={{ fill: "#ef4444", r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="profit" name="Gross Profit/Loss (₹)" stroke="#16a34a" strokeWidth={3} dot={{ fill: "#16a34a", r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="analytics-section profit-loss-summary">
            <h3>Profit & Loss Snapshot</h3>
            <div className="pl-strip">
              <div className="pl-pill">
                <span>Total Cost</span>
                <strong>₹{analytics.totalCost.toFixed(2)}</strong>
              </div>
              <div className="pl-pill">
                <span>Total Expenses</span>
                <strong className="profit-negative">₹{analytics.totalExpenses.toFixed(2)}</strong>
              </div>
              <div className="pl-pill">
                <span>Gross Profit / Loss</span>
                <strong className={analytics.grossProfit >= 0 ? "profit-positive" : "profit-negative"}>
                  {analytics.grossProfit >= 0 ? "+" : "-"}₹{Math.abs(analytics.grossProfit).toFixed(2)}
                </strong>
              </div>
              <div className="pl-pill">
                <span>Net Profit / Loss</span>
                <strong className={analytics.netProfit >= 0 ? "profit-positive" : "profit-negative"}>
                  {analytics.netProfit >= 0 ? "+" : "-"}₹{Math.abs(analytics.netProfit).toFixed(2)}
                </strong>
              </div>
              <div className="pl-pill">
                <span>Profitable Orders</span>
                <strong>{analytics.profitableOrders}</strong>
              </div>
              <div className="pl-pill">
                <span>Loss Orders</span>
                <strong>{analytics.lossOrders}</strong>
              </div>
              <div className="pl-pill">
                <span>Net Loss</span>
                <strong className="profit-negative">₹{analytics.netLoss.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <div className="analytics-section">
            <h3>Top 5 Best-Selling Products</h3>
            {analytics.topProducts.length > 0 ? (
              <CommonTable columns={topProductsColumns} data={topProductsData} fileName="top-products" showSelection={false} />
            ) : (
              <p>No sales data available yet.</p>
            )}
          </div>

          <div className="analytics-section">
            <h3>Recent Orders</h3>
            {analytics.recentOrders.length > 0 ? (
              <CommonTable columns={recentOrdersColumns} data={recentOrdersData} fileName="recent-orders" showSelection={false} />
            ) : (
              <p>No orders placed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
