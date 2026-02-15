import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { ProductContext } from "../context/ProductContext";
import Toast from "../components/Toast";

function Products() {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { products, getPriceForQuantity } = useContext(ProductContext);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [quantities, setQuantities] = useState({});
  const [toast, setToast] = useState(null);

  // Helper to display category names (rename Grains -> Grocery)
  const displayCategory = (category) => (category === "Grains" ? "Grocery" : category);

  // Get unique categories with display mapping
  const categories = ["All", ...new Set(products.map((p) => displayCategory(p.category)))];

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      (selectedCategory === "Grocery"
        ? product.category === "Grains"
        : product.category === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleQuantityChange = (productId, quantity) => {
    setQuantities({ ...quantities, [productId]: quantity });
  };

  const handleAddToCart = (product) => {
    const quantity = parseInt(quantities[product.id] || product.moq);
    
    if (quantity < product.moq) {
      setToast({
        message: `Minimum Order Quantity (MOQ) for ${product.name} is ${product.moq} ${product.unit}(s)`,
        type: "warning"
      });
      return;
    }

    addToCart({
      ...product,
      quantity: quantity,
      price: getPriceForQuantity(product.id, quantity)
    });
    
    setQuantities({ ...quantities, [product.id]: product.moq });
    setToast({
      message: `✨ Added ${quantity} ${product.unit}(s) of ${product.name} to cart!`,
      type: "success"
    });
  };

  return (
    <div className="products-page">
      <h2>Wholesale Products</h2>

      {/* Search Bar */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Filters */}
      <div className="filters-section">
        {/* Category Filter */}
        <div className="filter-group">
          <h4>Category</h4>
          <div>
            <select
              className="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-grid-container">
        {filteredProducts.length > 0 ? (
          <>
            {/* Category Header */}
            <div className="category-header">
              <h3>{selectedCategory === "All" ? "All Products" : selectedCategory}</h3>
              <button 
                onClick={() => setSelectedCategory("All")} 
                className="see-all-link"
              >
                see all
              </button>
            </div>
            
            <div className="products-grid">
              {filteredProducts.map((p, index) => {
                const liveQty = parseInt(quantities[p.id] || p.moq || 1);
                const tierPrice = getPriceForQuantity(p.id, liveQty);
                const originalPrice = p.price;
                const hasDiscount = tierPrice < originalPrice;

                return (
                  <div 
                    key={p.id} 
                    className="product-card"
                    style={{ '--card-index': index }}
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    {/* Product Image */}
                    <div className="product-image">
                      <img
                        src={p.image || `https://placehold.co/200x200?text=${encodeURIComponent(p.name)}`}
                        alt={p.name}
                        onError={(e) => {
                          e.target.src = `https://placehold.co/200x200?text=${encodeURIComponent(p.name)}`;
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="product-info">
                      <h3 className="product-name">{p.name}</h3>
                      <p className="product-quantity">{p.moq} {p.unit}</p>

                      {/* Price Section */}
                      <div className="product-price-section">
                        <div className="price-display">
                          {hasDiscount && (
                            <span className="original-price">₹{originalPrice}</span>
                          )}
                          <span className="current-price">₹{tierPrice}</span>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(p);
                          }}
                          className="add-btn"
                        >
                          ADD
                        </button>
                      </div>

                      {/* Quantity Selector (Hidden by default, shows on hover) */}
                      <div className="quantity-selector">
                        <input
                          type="number"
                          min={p.moq}
                          value={quantities[p.id] || p.moq}
                          onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                          className="quantity-input-card"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="no-products">No products found matching your filters.</p>
        )}
      </div>

      {/* Bulk Pricing Info */}
      <div className="bulk-info-section">
        <h3>💡 Bulk Pricing Benefits</h3>
        <p>Buy more, save more! Our wholesale prices decrease with larger quantities. Check the bulk pricing column for each product.</p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Products;
