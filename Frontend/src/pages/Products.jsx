import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { ProductContext } from "../context/ProductContext";

function Products() {
  const { addToCart } = useContext(CartContext);
  const { products, getPriceForQuantity } = useContext(ProductContext);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [quantities, setQuantities] = useState({});

  // Helper to display category names (rename Grains -> Grocery)
  const displayCategory = (category) => (category === "Grains" ? "Grocery" : category);

  // Get unique categories with display mapping
  const categories = ["All", ...new Set(products.map((p) => displayCategory(p.category)))];

  // Filter products based on search, category, and price
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      (selectedCategory === "Grocery"
        ? product.category === "Grains"
        : product.category === selectedCategory);
    const matchesPrice =
      product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const handleQuantityChange = (productId, quantity) => {
    setQuantities({ ...quantities, [productId]: quantity });
  };

  const handleAddToCart = (product) => {
    const quantity = parseInt(quantities[product.id] || 1);
    
    if (quantity < product.moq) {
      alert(`Minimum Order Quantity (MOQ) for ${product.name} is ${product.moq} ${product.unit}(s)`);
      return;
    }

    addToCart({
      ...product,
      quantity: quantity,
      price: getPriceForQuantity(product.id, quantity)
    });
    
    setQuantities({ ...quantities, [product.id]: 1 });
    alert(`Added ${quantity} ${product.unit}(s) to cart!`);
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

        {/* Price Range Filter */}
        <div className="filter-group">
          <h4>Price Range</h4>
          <div className="price-range">
            <label>
              Min: ₹
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([parseInt(e.target.value), priceRange[1]])
                }
                className="price-input"
              />
            </label>
            <label>
              Max: ₹
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], parseInt(e.target.value)])
                }
                className="price-input"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-table-container">
        {filteredProducts.length > 0 ? (
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>MOQ</th>
                <th>Bulk Pricing</th>
                <th>Quantity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const liveQty = parseInt(quantities[p.id] || p.moq || 1);
                const tierPrice = getPriceForQuantity(p.id, liveQty);

                return (
                <tr key={p.id}>
                  <td>
                    <img
                      src={p.image || `https://placehold.co/80x80?text=${encodeURIComponent(p.name)}`}
                      alt={p.name}
                      className="product-thumb"
                    />
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>
                    <span className="category-badge">{displayCategory(p.category)}</span>
                  </td>
                  <td className="price">
                    <div className="price-stack">
                      <span className="bulk-price">Price ₹{tierPrice}</span>
                      <small className="price-hint">Auto-applies with entered quantity</small>
                    </div>
                  </td>
                  <td className="moq-badge">
                    {p.moq} {p.unit}(s)
                  </td>
                  <td className="bulk-pricing-info">
                    <div className="pricing-tiers">
                      {p.bulkPricing.slice(0, 3).map((tier, idx) => (
                        <span key={idx} className="tier-badge">
                          {tier.quantity}+ @ ₹{tier.price}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={p.moq}
                      value={quantities[p.id] || 1}
                      onChange={(e) =>
                        handleQuantityChange(p.id, e.target.value)
                      }
                      className="quantity-input"
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="add-to-cart-btn"
                    >
                      Add to Cart
                    </button>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        ) : (
          <p className="no-products">No products found matching your filters.</p>
        )}
      </div>

      {/* Bulk Pricing Info */}
      <div className="bulk-info-section">
        <h3>💡 Bulk Pricing Benefits</h3>
        <p>Buy more, save more! Our wholesale prices decrease with larger quantities. Check the bulk pricing column for each product.</p>
      </div>
    </div>
  );
}

export default Products;
