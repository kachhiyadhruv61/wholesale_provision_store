import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrderContext } from "../context/OrderContext";
import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext";
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function AdminAnalytics() {
  const { orders } = useContext(OrderContext);
  const { products } = useContext(ProductContext);
  const { cart } = useContext(CartContext);
  const [range, setRange] = useState("7d"); // 7d | 30d | all
  const navigate = useNavigate();

  const colors = ["#667eea", "#764ba2", "#28a745", "#ff9f43", "#e74c3c", "#17a2b8"];

  const now = new Date();
  const startDate = useMemo(() => {
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

  // Calculate analytics
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => new Date(o.date) >= startDate);
  }, [orders, startDate]);

  const prevFilteredOrders = useMemo(() => {
    if (range === "all") return [];
    const size = range === "7d" ? 7 : 30;
    const endPrev = new Date(startDate);
    endPrev.setDate(endPrev.getDate() - 1);
    const startPrev = new Date(endPrev);
    startPrev.setDate(startPrev.getDate() - (size - 1));
    startPrev.setHours(0, 0, 0, 0);
    return orders.filter((o) => {
      const d = new Date(o.date);
      return d >= startPrev && d <= endPrev;
    });
  }, [orders, startDate, range]);

  const analytics = useMemo(() => {
    const list = filteredOrders;
    const totalOrders = list.length;
    const totalRevenue = list.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get orders by category
    const ordersByCategory = {};
    products.forEach((product) => {
      if (!ordersByCategory[product.category]) {
        ordersByCategory[product.category] = 0;
      }
    });

    // Count sold items by category (filtered)
    list.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((p) => p.id === item.id);
        if (product && ordersByCategory[product.category] !== undefined) {
          ordersByCategory[product.category] += 1;
        }
      });
    });

    // Get top products (units + revenue)
    const productSales = {};
    const productRevenue = {};
    list.forEach((order) => {
      order.items.forEach((item) => {
        productSales[item.name] = (productSales[item.name] || 0) + 1;
        const revenue = item.price || 0;
        productRevenue[item.name] = (productRevenue[item.name] || 0) + revenue;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, units]) => ({ name, units, revenue: productRevenue[name] || 0 }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    // Recent orders
    const recentOrders = list.slice(0, 10);

    // Daily sales (for chart)
    const dayKey = (d) => d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
    const daysMap = new Map();
    list.forEach((o) => {
      const d = new Date(o.date);
      const key = dayKey(d);
      const prev = daysMap.get(key) || { date: key, revenue: 0, orders: 0 };
      prev.revenue += o.total || 0;
      prev.orders += 1;
      daysMap.set(key, prev);
    });
    const dailySeries = Array.from(daysMap.values());

    // Previous period metrics for trend
    const prevRevenue = prevFilteredOrders.reduce((s, o) => s + (o.total || 0), 0);
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
      dailySeries,
      prevRevenue,
      prevOrders,
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
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toFixed(2)}`
    }
  ], []);

  const topProductsData = useMemo(
    () => analytics.topProducts.map((p) => ({ ...p })),
    [analytics.topProducts]
  );

  const recentOrdersColumns = useMemo(() => [
    {
      accessorKey: "id",
      header: "Order ID",
      Cell: ({ cell }) => `#${cell.getValue()}`
    },
    { accessorKey: "dateDisplay", header: "Date" },
    { accessorKey: "itemsCount", header: "Items" },
    {
      accessorKey: "totalValue",
      header: "Total",
      Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toFixed(2)}`
    },
    {
      accessorKey: "status",
      header: "Status",
      Cell: ({ row }) => <span className="status-badge confirmed">{row.original.status}</span>
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      Cell: ({ row }) => <span className="status-badge paid">{row.original.paymentStatus}</span>
    }
  ], []);

  const recentOrdersData = useMemo(
    () => analytics.recentOrders.map((order) => ({
      ...order,
      dateDisplay: new Date(order.date).toLocaleDateString(),
      itemsCount: order.items.length,
      totalValue: order.total || 0,
      status: order.status || "Confirmed",
      paymentStatus: order.paymentStatus || "Completed"
    })),
    [analytics.recentOrders]
  );

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/");
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <h3> Admin Panel</h3>
        <nav className="admin-nav">
          <button onClick={() => navigate("/admin-dashboard")}>Dashboard</button>
          <button className="active" onClick={() => navigate("/admin-analytics")}>Analytics</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <div className="admin-header">
          <h1>Admin Analytics</h1>
        </div>

        <div className="admin-section admin-analytics">
          <div className="analytics-header">
            <h2>Admin Analytics</h2>
            <div className="filter-bar">
              <span>Range:</span>
              <button className={`filter-btn ${range === "7d" ? "active" : ""}`} onClick={() => setRange("7d")}>7 Days</button>
              <button className={`filter-btn ${range === "30d" ? "active" : ""}`} onClick={() => setRange("30d")}>30 Days</button>
              <button className={`filter-btn ${range === "all" ? "active" : ""}`} onClick={() => setRange("all")}>All Time</button>
            </div>
          </div>

          {/* KPI Cards */}
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

          {/* Charts */}
          <div className="chart-grid">
        <div className="analytics-card">
          <h3>Revenue & Orders Trend</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics.dailySeries} margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6c757d"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6c757d"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue (₹)" 
                  stroke="#667eea" 
                  strokeWidth={3} 
                  dot={{ fill: '#667eea', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  name="Orders" 
                  stroke="#ff9f43" 
                  strokeWidth={3} 
                  dot={{ fill: '#ff9f43', r: 4 }}
                  activeDot={{ r: 6 }}
                />
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
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {Object.entries(analytics.ordersByCategory).map((_, idx) => (
                    <Cell key={idx} fill={colors[idx % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

          {/* Top Products Table */}
          <div className="analytics-section">
        <h3>Top 5 Best-Selling Products</h3>
        {analytics.topProducts.length > 0 ? (
              <CommonTable
                columns={topProductsColumns}
                data={topProductsData}
                fileName="top-products"
                showSelection={false}
              />
        ) : (
          <p>No sales data available yet.</p>
        )}
      </div>

          {/* Recent Orders */}
          <div className="analytics-section">
        <h3>Recent Orders</h3>
        {analytics.recentOrders.length > 0 ? (
          <CommonTable
            columns={recentOrdersColumns}
            data={recentOrdersData}
            fileName="recent-orders"
            showSelection={false}
          />
        ) : (
          <p>No orders placed yet.</p>
        )}
      </div>

          {/* Stats Summary */}
          <div className="analytics-section summary">
        <h3>Quick Summary</h3>
        <ul>
          <li>
            📊 <strong>Range:</strong> {range === "all" ? "All Time" : range === "7d" ? "Last 7 Days" : "Last 30 Days"}
          </li>
          <li>
            💹 <strong>Revenue Change:</strong> {analytics.revDeltaPct >= 0 ? "+" : "-"}{Math.abs(analytics.revDeltaPct).toFixed(1)}%
          </li>
          <li>
            🧮 <strong>Orders Change:</strong> {analytics.ordDeltaPct >= 0 ? "+" : "-"}{Math.abs(analytics.ordDeltaPct).toFixed(1)}%
          </li>
          <li>
            🛒 <strong>Current Cart Items:</strong> {analytics.cartItems}
          </li>
          <li>
            📦 <strong>Inventory:</strong> {analytics.totalProducts} SKUs available
          </li>
        </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
