import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ProductContext } from "../context/ProductContext";
import { OrderContext } from "../context/OrderContext";
import { PaymentContext } from "../context/PaymentContext";

function AdminDashboard() {
  const { products, addProduct, updateProduct, deleteProduct, updateStock } = useContext(ProductContext);
  const { orders, updateOrderStatus } = useContext(OrderContext);
  const { payments, addPayment, updatePaymentStatus } = useContext(PaymentContext);
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
    category: "Grocery",
    price: "",
    wholesalePrice: "",
    stock: "",
    moq: "",
    unit: "bag",
    description: "",
    image: ""
  });

  const [imagePreview, setImagePreview] = useState(null);

  const categories = ["Grocery", "Masala Spices", "Pan Center", "Daily Used Product", "Snacks", "Biscuit", "Chocolates"];
  const units = ["bag", "box", "bottle", "kg", "litre"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "Grocery",
      price: "",
      wholesalePrice: "",
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
    if (!formData.name || !formData.price || !formData.wholesalePrice || !formData.stock) {
      alert("Please fill all required fields");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      wholesalePrice: Number(formData.wholesalePrice),
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
    if (!formData.name || !formData.price || !formData.wholesalePrice || !formData.stock) {
      alert("Please fill all required fields");
      return;
    }

    const updatedProduct = {
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      wholesalePrice: Number(formData.wholesalePrice),
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
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      wholesalePrice: product.wholesalePrice,
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

  const handleStockUpdate = (id, currentStock) => {
    const newStock = prompt(`Update stock for this product (Current: ${currentStock}):`, currentStock);
    if (newStock !== null && !isNaN(newStock)) {
      updateStock(id, Number(newStock));
      alert("Stock Updated Successfully!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/");
  };

  const handlePriceEditClick = (product) => {
    setEditingPrice(product);
    setPriceFormData({
      retailPrice: product.price,
      wholesalePrice: product.wholesalePrice
    });
  };

  const handleUpdatePrice = () => {
    if (!priceFormData.retailPrice || !priceFormData.wholesalePrice) {
      alert("Please fill all price fields");
      return;
    }

    const retailPrice = Number(priceFormData.retailPrice);
    const wholesalePrice = Number(priceFormData.wholesalePrice);

    if (retailPrice < wholesalePrice) {
      alert("Retail price must be greater than wholesale price");
      return;
    }

    const updatedData = {
      ...editingPrice,
      price: retailPrice,
      wholesalePrice: wholesalePrice,
      bulkPricing: [
        { quantity: 1, price: retailPrice },
        { quantity: 5, price: retailPrice * 0.95 },
        { quantity: 10, price: retailPrice * 0.90 },
        { quantity: 20, price: wholesalePrice }
      ]
    };

    updateProduct(editingPrice.id, updatedData);
    alert("Price Updated Successfully!");
    setEditingPrice(null);
    setPriceFormData({ retailPrice: "", wholesalePrice: "" });
  };

  const handleCancelPriceEdit = () => {
    setEditingPrice(null);
    setPriceFormData({ retailPrice: "", wholesalePrice: "" });
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.stock < 50);
  };

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
      "Pending": "🟡",
      "Processing": "🔵",
      "Delivered": "🟢",
      "Cancelled": "🔴"
    };
    return statusMap[status] || "⚪";
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
    const totalPayments = payments.length;
    const paidAmount = payments
      .filter(p => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = payments.filter(p => p.status === "Pending").length;
    const failedPayments = payments.filter(p => p.status === "Failed").length;

    return { totalPayments, paidAmount, pendingPayments, failedPayments };
  };

  const getPaymentMethodIcon = (method) => {
    const methodMap = {
      "UPI": "📱",
      "Debit Card": "💳",
      "Credit Card": "💳",
      "Net Banking": "🏦",
      "COD": "💵"
    };
    return methodMap[method] || "💳";
  };

  const getPaymentStatusColor = (status) => {
    const statusMap = {
      "Paid": "🟢",
      "Pending": "🟡",
      "Failed": "🔴",
      "Refunded": "🔵"
    };
    return statusMap[status] || "⚪";
  };

  const handleUpdatePaymentStatus = (paymentId, newStatus) => {
    if (updatePaymentStatus) {
      updatePaymentStatus(paymentId, newStatus);
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const getFilteredPayments = () => {
    if (paymentStatusFilter === "all") return payments;
    return payments.filter(p => p.status === paymentStatusFilter);
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

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <h3>Admin Panel</h3>
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
          <button onClick={() => navigate("/admin-analytics")}>
            Analytics
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
            {activeTab === "stock" && "Stock Management Dashboard"}
            {activeTab === "pricing" && "Pricing Management"}
          </h1>
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
                  Add New Product
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
                        <option key={cat} value={cat}>{cat}</option>
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
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief product description"
                      rows="3"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Product Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ padding: "10px" }}
                    />
                    {imagePreview && (
                      <div style={{ marginTop: "10px" }}>
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "contain", border: "1px solid #ddd", borderRadius: "8px", padding: "5px" }}
                        />
                      </div>
                    )}
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
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Retail Price</th>
                    <th>Wholesale</th>
                    <th>Stock</th>
                    <th>MOQ</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td><span className="category-badge">{product.category}</span></td>
                      <td>₹{product.price}</td>
                      <td>₹{product.wholesalePrice}</td>
                      <td>
                        <span className={`stock-badge ${product.stock < 50 ? 'low' : ''}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>{product.moq}</td>
                      <td className="actions">
                        <button 
                          className="btn-edit" 
                          onClick={() => handleEditClick(product)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    <div className="stock-value">
                      Stock Value: ₹{(product.price * product.stock).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    className="btn-stock-update"
                    onClick={() => handleStockUpdate(product.id, product.stock)}
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
            <div className="section-header">
              <h2>Pricing Overview</h2>
            </div>

            {editingPrice && (
              <div className="product-form-card">
                <h3>Edit Price - {editingPrice.name}</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Retail Price (₹) *</label>
                    <input
                      type="number"
                      value={priceFormData.retailPrice}
                      onChange={(e) => setPriceFormData(prev => ({ ...prev, retailPrice: e.target.value }))}
                      placeholder="1200"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Wholesale Price (₹) *</label>
                    <input
                      type="number"
                      value={priceFormData.wholesalePrice}
                      onChange={(e) => setPriceFormData(prev => ({ ...prev, wholesalePrice: e.target.value }))}
                      placeholder="1050"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="price-info">
                  <div className="price-info-row">
                    <span>Margin:</span>
                    <strong>₹{(Number(priceFormData.retailPrice) - Number(priceFormData.wholesalePrice)).toFixed(2)}</strong>
                  </div>
                  <div className="price-info-row">
                    <span>Margin %:</span>
                    <strong>{Number(priceFormData.retailPrice) > 0 ? (((Number(priceFormData.retailPrice) - Number(priceFormData.wholesalePrice)) / Number(priceFormData.retailPrice)) * 100).toFixed(1) : 0}%</strong>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleUpdatePrice}>
                    💾 Update Price
                  </button>
                  <button className="btn-cancel" onClick={handleCancelPriceEdit}>
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className="pricing-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Retail Price</th>
                    <th>Wholesale Price</th>
                    <th>Margin</th>
                    <th>Margin %</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => {
                    const margin = product.price - product.wholesalePrice;
                    const marginPercent = product.price > 0 ? ((margin / product.price) * 100).toFixed(1) : 0;
                    
                    return (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name}</strong>
                          <br />
                          <small>{product.category}</small>
                        </td>
                        <td className="price">₹{product.price.toLocaleString()}</td>
                        <td className="price">₹{product.wholesalePrice.toLocaleString()}</td>
                        <td className="margin">₹{margin.toLocaleString()}</td>
                        <td>
                          <span className="margin-badge">{marginPercent}%</span>
                        </td>
                        <td>
                          <button 
                            className="btn-edit" 
                            onClick={() => handlePriceEditClick(product)}
                            title="Edit Price"
                          >
                            ✏️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                  🟡 Pending ({orders.filter(o => o.status === "Pending").length})
                </button>
                <button 
                  className={statusFilter === "Processing" ? "active" : ""} 
                  onClick={() => setStatusFilter("Processing")}
                >
                  🔵 Processing ({orders.filter(o => o.status === "Processing").length})
                </button>
                <button 
                  className={statusFilter === "Delivered" ? "active" : ""} 
                  onClick={() => setStatusFilter("Delivered")}
                >
                  🟢 Delivered ({orders.filter(o => o.status === "Delivered").length})
                </button>
                <button 
                  className={statusFilter === "Cancelled" ? "active" : ""} 
                  onClick={() => setStatusFilter("Cancelled")}
                >
                  🔴 Cancelled ({orders.filter(o => o.status === "Cancelled").length})
                </button>
              </div>
            </div>

            {getFilteredOrders().length === 0 ? (
              <div className="empty-state">
                <p>No orders found</p>
              </div>
            ) : (
              <div className="orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Total Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredOrders().map(order => (
                      <tr key={order.id}>
                        <td>
                          <strong>#{order.id}</strong>
                        </td>
                        <td>{getCustomerName(order)}</td>
                        <td>{formatDate(order.date)}</td>
                        <td className="amount">₹{order.total?.toLocaleString() || 0}</td>
                        <td>
                          <span className="payment-badge">
                            {order.paymentMethod === "cod" ? "COD" : "Online"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${order.status?.toLowerCase() || 'pending'}`}>
                            {getStatusBadge(order.status || "Pending")} {order.status || "Pending"}
                          </span>
                        </td>
                        <td className="actions">
                          <button 
                            className="btn-view" 
                            onClick={() => handleViewOrder(order)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          <select 
                            className="btn-status-select"
                            value={order.status || "Pending"}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            title="Update Status"
                          >
                            <option value="Pending">🟡 Pending</option>
                            <option value="Processing">🔵 Processing</option>
                            <option value="Delivered">🟢 Delivered</option>
                            <option value="Cancelled">🔴 Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      ✕
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
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.name || "Product"}</td>
                              <td>{item.quantity || 0}</td>
                              <td>₹{item.price?.toLocaleString() || 0}</td>
                              <td>₹{((item.quantity || 0) * (item.price || 0)).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                      <option value="UPI">📱 UPI</option>
                      <option value="Debit Card">💳 Debit Card</option>
                      <option value="Credit Card">💳 Credit Card</option>
                      <option value="Net Banking">🏦 Net Banking</option>
                      <option value="COD">💵 Cash on Delivery</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Payment Status *</label>
                    <select name="status" value={paymentFormData.status} onChange={handlePaymentInputChange}>
                      <option value="Pending">🟡 Pending</option>
                      <option value="Paid">🟢 Paid</option>
                      <option value="Failed">🔴 Failed</option>
                      <option value="Refunded">🔵 Refunded</option>
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
                  All ({payments.length})
                </button>
                <button 
                  className={paymentStatusFilter === "Paid" ? "active" : ""} 
                  onClick={() => setPaymentStatusFilter("Paid")}
                >
                  🟢 Paid ({payments.filter(p => p.status === "Paid").length})
                </button>
                <button 
                  className={paymentStatusFilter === "Pending" ? "active" : ""} 
                  onClick={() => setPaymentStatusFilter("Pending")}
                >
                  🟡 Pending ({payments.filter(p => p.status === "Pending").length})
                </button>
                <button 
                  className={paymentStatusFilter === "Failed" ? "active" : ""} 
                  onClick={() => setPaymentStatusFilter("Failed")}
                >
                  🔴 Failed ({payments.filter(p => p.status === "Failed").length})
                </button>
                <button 
                  className={paymentStatusFilter === "Refunded" ? "active" : ""} 
                  onClick={() => setPaymentStatusFilter("Refunded")}
                >
                  🔵 Refunded ({payments.filter(p => p.status === "Refunded").length})
                </button>
              </div>
            </div>

            {getFilteredPayments().length === 0 ? (
              <div className="empty-state">
                <p>No payments found</p>
              </div>
            ) : (
              <div className="payments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPayments().map(payment => (
                      <tr key={payment.id}>
                        <td>
                          <strong>{payment.id}</strong>
                        </td>
                        <td>{payment.orderId}</td>
                        <td>{payment.customerName}</td>
                        <td>{formatDate(payment.date)}</td>
                        <td>
                          <span className="method-badge">
                            {getPaymentMethodIcon(payment.method)} {payment.method}
                          </span>
                        </td>
                        <td className="amount">₹{payment.amount?.toLocaleString() || 0}</td>
                        <td>
                          <span className={`payment-status-badge status-${payment.status?.toLowerCase() || 'pending'}`}>
                            {getPaymentStatusColor(payment.status || "Pending")} {payment.status || "Pending"}
                          </span>
                        </td>
                        <td className="actions">
                          <button 
                            className="btn-view" 
                            onClick={() => handleViewPayment(payment)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          <select 
                            className="btn-status-select"
                            value={payment.status || "Pending"}
                            onChange={(e) => handleUpdatePaymentStatus(payment.id, e.target.value)}
                            title="Update Status"
                          >
                            <option value="Paid">🟢 Paid</option>
                            <option value="Pending">🟡 Pending</option>
                            <option value="Failed">🔴 Failed</option>
                            <option value="Refunded">🔵 Refunded</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      ✕
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