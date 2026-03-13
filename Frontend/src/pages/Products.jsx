import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { ProductContext } from "../context/ProductContext";
import Toast from "../components/Toast";

function Products() {
  const { addToCart } = useContext(CartContext);
  const { products } = useContext(ProductContext);

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

  const getProductMOQ = (product) => product.moq || 1;

  const getCurrentQuantity = (product) => {
    const moq = getProductMOQ(product);
    return parseInt(quantities[product.id] || moq, 10);
  };

  const incrementQuantity = (product) => {
    const currentQty = getCurrentQuantity(product);
    setQuantities((prev) => ({
      ...prev,
      [product.id]: currentQty + 1,
    }));
  };

  const decrementQuantity = (product) => {
    const moq = getProductMOQ(product);
    const currentQty = getCurrentQuantity(product);
    setQuantities((prev) => ({
      ...prev,
      [product.id]: Math.max(moq, currentQty - 1),
    }));
  };

  const handleAddToCart = (product) => {
    const moqQuantity = getProductMOQ(product);
    const selectedQuantity = getCurrentQuantity(product);

    if (selectedQuantity < moqQuantity) {
      setToast({
        message: `Minimum Order Quantity (MOQ) for ${product.name} is ${moqQuantity} ${product.unit}(s)`,
        type: "warning"
      });
      return;
    }

    const result = addToCart({
      ...product,
      quantity: selectedQuantity,
    });

    if (!result?.success) {
      setToast({
        message: `Insufficient stock for ${result.productName}: requested ${result.requested}, available ${result.available}`,
        type: "warning"
      });
      return;
    }

    setToast({
      message: `✨ Added ${selectedQuantity} ${product.unit}(s) of ${product.name} to cart!`,
      type: "success"
    });
  };

  return (
    <div 
      className="products-page"
      style={{
        background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${process.env.PUBLIC_URL}/images/logos/productbg.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh'
      }}
    >
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
              {filteredProducts.map((p) => {
                return (
                  <div key={p.id} className="product-card-home">
                    <div className="product-image-wrapper">
                      <img
                        src={p.image || `https://placehold.co/200x200?text=${encodeURIComponent(p.name)}`}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = `https://placehold.co/200x200?text=${encodeURIComponent(p.name)}`;
                        }}
                      />
                      <span className="product-badge">{displayCategory(p.category)}</span>
                    </div>

                    <div className="product-info-home">
                      <h3>{p.name}</h3>
                      <p className="product-description">{p.description}</p>
                      <div className="product-pricing">
                        <span className="price-label">Wholesale Price:</span>
                        <span className="price">₹{p.wholesalePrice ?? p.price}</span>
                      </div>
                      <div className="product-moq">
                        <span>MOQ: {p.moq} {p.unit}</span>
                      </div>
                      <div className="product-qty-controls">
                        <button
                          className="qty-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            decrementQuantity(p);
                          }}
                        >
                          −
                        </button>
                        <span className="qty-value">{getCurrentQuantity(p)}</span>
                        <button
                          className="qty-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            incrementQuantity(p);
                          }}
                        >
                          +
                        </button>
                      </div>
                      <div className="product-actions">
                        <button
                          className="btn-add-to-cart"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(p);
                          }}
                        >
                          🛒 Add to Cart
                        </button>
                        <Link to={`/product/${p.id}`} className="btn-view-details">
                          View Details
                        </Link>
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
