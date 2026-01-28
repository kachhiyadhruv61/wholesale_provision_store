import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ProductContext } from "../context/ProductContext";

function AdminDashboard() {
  const { products, addProduct, updateProduct, deleteProduct, updateStock } = useContext(ProductContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("products");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceFormData, setPriceFormData] = useState({
    retailPrice: "",
    wholesalePrice: ""
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
    description: ""
  });

  const categories = ["Grocery", "Masala Spices", "PAN CENTER", "Daily Used Product", "Snacks", "Biscuit", "Chocolates"];
  const units = ["bag", "box", "bottle", "kg", "litre"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      description: ""
    });
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
      description: product.description || ""
    });
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
    navigate("/admin");
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
          <h1>Product Management Dashboard</h1>
          <div className="admin-stats">
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
      </div>
    </div>
  );
}

export default AdminDashboard;