import { useNavigate } from "react-router-dom";
import { useState, useContext, useMemo, useEffect, useRef } from "react";
import { OrderContext } from "../context/OrderContext";
import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext";
import { UserContext } from "../context/UserContext";
import { NotificationContext } from "../context/NotificationContext";
import CommonTable from "../components/CommonTable";
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

function AdminHome() {
  const navigate = useNavigate();
  const [adminUsername] = useState(localStorage.getItem("adminUsername") || "Admin");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const analyticsSectionRef = useRef(null);
  const { orders } = useContext(OrderContext);
  const { products } = useContext(ProductContext);
  const { cart } = useContext(CartContext);
  const { user } = useContext(UserContext);
  const [range, setRange] = useState("7d");
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
    
    return { totalOrders, totalRevenue, activeUsers };
  }, [orders, user]);

  const analyticsColors = ["#667eea", "#764ba2", "#28a745", "#ff9f43", "#e74c3c", "#17a2b8"];

  const startDate = useMemo(() => {
    const now = new Date();
    if (range === "7d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (range === "30d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return new Date(0);
  }, [range]);

  const filteredOrders = useMemo(
    () => orders.filter((order) => new Date(order.date) >= startDate),
    [orders, startDate]
  );

  const prevFilteredOrders = useMemo(() => {
    if (range === "all") return [];
    const size = range === "7d" ? 7 : 30;
    const endPrev = new Date(startDate);
    endPrev.setDate(endPrev.getDate() - 1);
    const startPrev = new Date(endPrev);
    startPrev.setDate(startPrev.getDate() - (size - 1));
    startPrev.setHours(0, 0, 0, 0);
    return orders.filter((order) => {
      const d = new Date(order.date);
      return d >= startPrev && d <= endPrev;
    });
  }, [orders, startDate, range]);

  const analytics = useMemo(() => {
    const list = filteredOrders;
    const totalOrders = list.length;
    const totalRevenue = list.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
    list.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.id ?? item.name;
        const qty = Number(item.quantity || 1);
        const unitPrice = Number(item.price || 0);
        const revenue = unitPrice * qty;

        productSales[key] = (productSales[key] || 0) + qty;
        productRevenue[key] = (productRevenue[key] || 0) + revenue;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([key, units]) => {
        const name = products.find((p) => p.id === Number(key))?.name || key;
        return { name, units, revenue: productRevenue[key] || 0 };
      })
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const recentOrders = list.slice(0, 10);

    const dayKey = (d) => d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
    const daysMap = new Map();
    list.forEach((order) => {
      const d = new Date(order.date);
      const key = dayKey(d);
      const prev = daysMap.get(key) || { date: key, revenue: 0, orders: 0 };
      prev.revenue += order.total || 0;
      prev.orders += 1;
      daysMap.set(key, prev);
    });

    const prevRevenue = prevFilteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const prevOrders = prevFilteredOrders.length;
    const revDeltaPct = prevRevenue === 0 ? 100 : ((totalRevenue - prevRevenue) / prevRevenue) * 100;
    const ordDeltaPct = prevOrders === 0 ? 100 : ((totalOrders - prevOrders) / prevOrders) * 100;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByCategory,
      topProducts,
      recentOrders,
      totalProducts: products.length,
      cartItems: cart.length,
      dailySeries: Array.from(daysMap.values()),
      revDeltaPct,
      ordDeltaPct,
    };
  }, [filteredOrders, prevFilteredOrders, products, cart]);

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
    navigate("/admin");
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
          </div>
        </div>

        <div className="admin-section admin-analytics" id="admin-home-analytics" ref={analyticsSectionRef}>
          <div className="analytics-header">
            <h2>Admin Analytics</h2>
            <div className="filter-bar">
              <span>Range:</span>
              <button className={`filter-btn ${range === "7d" ? "active" : ""}`} onClick={() => setRange("7d")}>7 Days</button>
              <button className={`filter-btn ${range === "30d" ? "active" : ""}`} onClick={() => setRange("30d")}>30 Days</button>
              <button className={`filter-btn ${range === "all" ? "active" : ""}`} onClick={() => setRange("all")}>All Time</button>
            </div>
          </div>

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
              <div className="kpi-icon">📦</div>
              <div className="kpi-content">
                <h4>Avg Order Value</h4>
                <p className="kpi-value">₹{analytics.averageOrderValue.toFixed(2)}</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">🧾</div>
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
