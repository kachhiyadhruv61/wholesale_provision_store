import { useNavigate } from "react-router-dom";
import { useState, useContext, useMemo } from "react";
import { OrderContext } from "../context/OrderContext";
import { UserContext } from "../context/UserContext";

function AdminHome() {
  const navigate = useNavigate();
  const [adminUsername] = useState(localStorage.getItem("adminUsername") || "Admin");
  const { orders } = useContext(OrderContext);
  const { user } = useContext(UserContext);

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
