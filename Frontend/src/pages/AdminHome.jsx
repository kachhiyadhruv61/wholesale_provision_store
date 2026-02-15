import { useNavigate } from "react-router-dom";
import { useState, useContext, useMemo, useEffect, useRef } from "react";
import { OrderContext } from "../context/OrderContext";
import { UserContext } from "../context/UserContext";
import { NotificationContext } from "../context/NotificationContext";

function AdminHome() {
  const navigate = useNavigate();
  const [adminUsername] = useState(localStorage.getItem("adminUsername") || "Admin");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const { orders } = useContext(OrderContext);
  const { user } = useContext(UserContext);
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
          <div className="admin-menu-card" onClick={() => navigate("/admin-analytics")}>
            <div className="card-icon">📈</div>
            <h3>Analytics</h3>
            <p>Detailed reports, sales trends, and performance metrics</p>
            <button className="btn-navigate">Go to Analytics →</button>
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
      </div>
    </div>
  );
}

export default AdminHome;
