import { createContext, useState } from "react";

export const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([
    { 
      id: 1, 
      name: "Rice 25kg", 
      category: "Grains", 
      price: 1200,
      wholesalePrice: 1050,
      stock: 150,
      moq: 2,
      unit: "bag",
      description: "Premium quality rice",
      image: "/images/Rice.jpeg",
      bulkPricing: [
        { quantity: 1, price: 1200 },
        { quantity: 5, price: 1150 },
        { quantity: 10, price: 1100 },
        { quantity: 20, price: 1050 }
      ]
    },
    { 
      id: 2, 
      name: "Sugar 10kg", 
      category: "Sweeteners", 
      price: 450,
      wholesalePrice: 390,
      stock: 200,
      moq: 3,
      unit: "bag",
      description: "Pure white sugar",
      image: "/images/sugar.jpeg",
      bulkPricing: [
        { quantity: 1, price: 450 },
        { quantity: 5, price: 430 },
        { quantity: 10, price: 410 },
        { quantity: 20, price: 390 }
      ]
    },
    { 
      id: 3, 
      name: "Wheat Flour 20kg", 
      category: "Grains", 
      price: 850,
      wholesalePrice: 750,
      stock: 120,
      moq: 2,
      unit: "bag",
      description: "High quality wheat flour",
      image: "/images/Wheat Flour.jpeg",
      bulkPricing: [
        { quantity: 1, price: 850 },
        { quantity: 5, price: 820 },
        { quantity: 10, price: 790 },
        { quantity: 20, price: 750 }
      ]
    },
    { 
      id: 4, 
      name: "Basmati Rice 10kg", 
      category: "Grains", 
      price: 650,
      wholesalePrice: 575,
      stock: 80,
      moq: 1,
      unit: "bag",
      description: "Premium Basmati rice",
      image: "/images/Basmati Rice.jpeg",
      bulkPricing: [
        { quantity: 1, price: 650 },
        { quantity: 5, price: 625 },
        { quantity: 10, price: 600 },
        { quantity: 20, price: 575 }
      ]
    },
    { 
      id: 5, 
      name: "Jaggery 5kg", 
      category: "Sweeteners", 
      price: 350,
      wholesalePrice: 290,
      stock: 180,
      moq: 5,
      unit: "box",
      description: "Natural jaggery blocks",
      bulkPricing: [
        { quantity: 1, price: 350 },
        { quantity: 10, price: 330 },
        { quantity: 20, price: 310 },
        { quantity: 50, price: 290 }
      ]
    },
    { 
      id: 6, 
      name: "Oil 5L", 
      category: "Oils", 
      price: 520,
      wholesalePrice: 460,
      stock: 95,
      moq: 3,
      unit: "bottle",
      description: "Refined cooking oil",
      bulkPricing: [
        { quantity: 1, price: 520 },
        { quantity: 5, price: 500 },
        { quantity: 10, price: 480 },
        { quantity: 20, price: 460 }
      ]
    },
    { 
      id: 7, 
      name: "Mustard Oil 10L", 
      category: "Oils", 
      price: 980,
      wholesalePrice: 890,
      stock: 65,
      moq: 2,
      unit: "bottle",
      description: "Pure mustard oil",
      image: "/images/Mustard Oil 10L.jpeg",
      bulkPricing: [
        { quantity: 1, price: 980 },
        { quantity: 5, price: 950 },
        { quantity: 10, price: 920 },
        { quantity: 20, price: 890 }
      ]
    },
    { 
      id: 8, 
      name: "Salt 25kg", 
      category: "Spices", 
      price: 180,
      wholesalePrice: 150,
      stock: 250,
      moq: 4,
      unit: "bag",
      description: "Refined iodized salt",
      image: "/images/salt.jpeg",
      bulkPricing: [
        { quantity: 1, price: 180 },
        { quantity: 10, price: 170 },
        { quantity: 25, price: 160 },
        { quantity: 50, price: 150 }
      ]
    },
    { 
      id: 9, 
      name: "Turmeric Powder 1kg", 
      category: "Spices", 
      price: 450,
      wholesalePrice: 390,
      stock: 140,
      moq: 2,
      unit: "box",
      description: "Pure turmeric powder",
      image: "/images/Turmeric Powder.jpeg",
      bulkPricing: [
        { quantity: 1, price: 450 },
        { quantity: 5, price: 430 },
        { quantity: 10, price: 410 },
        { quantity: 20, price: 390 }
      ]
    },
    { 
      id: 10, 
      name: "Chilli Powder 2kg", 
      category: "Spices", 
      price: 320,
      wholesalePrice: 260,
      stock: 110,
      moq: 3,
      unit: "box",
      description: "Hot chilli powder",
      image: "/images/Chilli Powder.jpeg",
      bulkPricing: [
        { quantity: 1, price: 320 },
        { quantity: 5, price: 300 },
        { quantity: 10, price: 280 },
        { quantity: 20, price: 260 }
      ]
    },
    { 
      id: 11, 
      name: "Brown Rice 20kg", 
      category: "Grains", 
      price: 950,
      wholesalePrice: 850,
      stock: 130,
      moq: 2,
      unit: "bag",
      description: "Nutritious brown rice",
      bulkPricing: [
        { quantity: 1, price: 950 },
        { quantity: 5, price: 920 },
        { quantity: 10, price: 880 },
        { quantity: 20, price: 850 }
      ]
    },
    { 
      id: 12, 
      name: "Sona Masoori 25kg", 
      category: "Grains", 
      price: 1150,
      wholesalePrice: 1020,
      stock: 90,
      moq: 2,
      unit: "bag",
      description: "Sona Masoori rice",
      bulkPricing: [
        { quantity: 1, price: 1150 },
        { quantity: 5, price: 1100 },
        { quantity: 10, price: 1060 },
        { quantity: 20, price: 1020 }
      ]
    },
    { 
      id: 13, 
      name: "Maida Flour 10kg", 
      category: "Grains", 
      price: 420,
      wholesalePrice: 370,
      stock: 160,
      moq: 3,
      unit: "bag",
      description: "Refined wheat flour (maida)",
      bulkPricing: [
        { quantity: 1, price: 420 },
        { quantity: 5, price: 400 },
        { quantity: 10, price: 385 },
        { quantity: 20, price: 370 }
      ]
    },
    { 
      id: 14, 
      name: "Ragi Flour 10kg", 
      category: "Grains", 
      price: 480,
      wholesalePrice: 420,
      stock: 100,
      moq: 2,
      unit: "bag",
      description: "Finger millet flour",
      bulkPricing: [
        { quantity: 1, price: 480 },
        { quantity: 5, price: 460 },
        { quantity: 10, price: 440 },
        { quantity: 20, price: 420 }
      ]
    },
    { 
      id: 15, 
      name: "Barley 25kg", 
      category: "Grains", 
      price: 780,
      wholesalePrice: 700,
      stock: 85,
      moq: 2,
      unit: "bag",
      description: "Whole barley grains",
      bulkPricing: [
        { quantity: 1, price: 780 },
        { quantity: 5, price: 760 },
        { quantity: 10, price: 730 },
        { quantity: 20, price: 700 }
      ]
    },
    { 
      id: 16, 
      name: "Millet 20kg", 
      category: "Grains", 
      price: 620,
      wholesalePrice: 560,
      stock: 120,
      moq: 2,
      unit: "bag",
      description: "Mixed millet grains",
      bulkPricing: [
        { quantity: 1, price: 620 },
        { quantity: 5, price: 600 },
        { quantity: 10, price: 580 },
        { quantity: 20, price: 560 }
      ]
    },
    { 
      id: 17, 
      name: "Poha 20kg", 
      category: "Grains", 
      price: 520,
      wholesalePrice: 470,
      stock: 140,
      moq: 3,
      unit: "bag",
      description: "Flattened rice (poha)",
      image: "/images/Poha.jpeg",
      bulkPricing: [
        { quantity: 1, price: 520 },
        { quantity: 5, price: 500 },
        { quantity: 10, price: 485 },
        { quantity: 20, price: 470 }
      ]
    },
    { 
      id: 18, 
      name: "Brown Sugar 10kg", 
      category: "Sweeteners", 
      price: 520,
      wholesalePrice: 460,
      stock: 150,
      moq: 2,
      unit: "bag",
      description: "Unrefined brown sugar",
      image: "/images/Brown Sugar.jpeg",
      bulkPricing: [
        { quantity: 1, price: 520 },
        { quantity: 5, price: 500 },
        { quantity: 10, price: 480 },
        { quantity: 20, price: 460 }
      ]
    },
    { 
      id: 19, 
      name: "Rock Sugar 5kg", 
      category: "Sweeteners", 
      price: 400,
      wholesalePrice: 340,
      stock: 120,
      moq: 3,
      unit: "box",
      description: "Crystal rock sugar",
      image: "/images/Rock sugar.jpeg",
      bulkPricing: [
        { quantity: 1, price: 400 },
        { quantity: 5, price: 380 },
        { quantity: 10, price: 360 },
        { quantity: 20, price: 340 }
      ]
    },
    { 
      id: 20, 
      name: "Liquid Glucose 10kg", 
      category: "Sweeteners", 
      price: 720,
      wholesalePrice: 640,
      stock: 70,
      moq: 2,
      unit: "box",
      description: "Food grade liquid glucose",
      bulkPricing: [
        { quantity: 1, price: 720 },
        { quantity: 5, price: 700 },
        { quantity: 10, price: 670 },
        { quantity: 20, price: 640 }
      ]
    },
    { 
      id: 21, 
      name: "Honey 5kg", 
      category: "Sweeteners", 
      price: 1600,
      wholesalePrice: 1450,
      stock: 60,
      moq: 1,
      unit: "box",
      description: "Pure honey bulk pack",
      image: "/images/Honey.jpeg",
      bulkPricing: [
        { quantity: 1, price: 1600 },
        { quantity: 5, price: 1550 },
        { quantity: 10, price: 1500 },
        { quantity: 20, price: 1450 }
      ]
    },
    { 
      id: 22, 
      name: "Molasses 10kg", 
      category: "Sweeteners", 
      price: 680,
      wholesalePrice: 600,
      stock: 95,
      moq: 2,
      unit: "box",
      description: "Sugarcane molasses",
      bulkPricing: [
        { quantity: 1, price: 680 },
        { quantity: 5, price: 660 },
        { quantity: 10, price: 630 },
        { quantity: 20, price: 600 }
      ]
    },
    { 
      id: 23, 
      name: "Stevia 1kg", 
      category: "Sweeteners", 
      price: 1100,
      wholesalePrice: 980,
      stock: 85,
      moq: 1,
      unit: "box",
      description: "Stevia sweetener powder",
      bulkPricing: [
        { quantity: 1, price: 1100 },
        { quantity: 5, price: 1060 },
        { quantity: 10, price: 1020 },
        { quantity: 20, price: 980 }
      ]
    },
    { 
      id: 24, 
      name: "Dates Syrup 5kg", 
      category: "Sweeteners", 
      price: 950,
      wholesalePrice: 860,
      stock: 70,
      moq: 2,
      unit: "box",
      description: "Dates syrup bulk pack",
      bulkPricing: [
        { quantity: 1, price: 950 },
        { quantity: 5, price: 920 },
        { quantity: 10, price: 890 },
        { quantity: 20, price: 860 }
      ]
    },
    { 
      id: 25, 
      name: "Palm Jaggery 5kg", 
      category: "Sweeteners", 
      price: 500,
      wholesalePrice: 430,
      stock: 110,
      moq: 3,
      unit: "box",
      description: "Palm jaggery blocks",
      bulkPricing: [
        { quantity: 1, price: 500 },
        { quantity: 10, price: 470 },
        { quantity: 20, price: 450 },
        { quantity: 50, price: 430 }
      ]
    },
    { 
      id: 26, 
      name: "Sunflower Oil 5L", 
      category: "Oils", 
      price: 560,
      wholesalePrice: 500,
      stock: 100,
      moq: 3,
      unit: "bottle",
      description: "Refined sunflower oil",
      image: "/images/sunflower oil.jpeg",
      bulkPricing: [
        { quantity: 1, price: 560 },
        { quantity: 5, price: 540 },
        { quantity: 10, price: 520 },
        { quantity: 20, price: 500 }
      ]
    },
    { 
      id: 27, 
      name: "Groundnut Oil 10L", 
      category: "Oils", 
      price: 1150,
      wholesalePrice: 1040,
      stock: 80,
      moq: 2,
      unit: "bottle",
      description: "Cold-pressed groundnut oil",
      bulkPricing: [
        { quantity: 1, price: 1150 },
        { quantity: 5, price: 1120 },
        { quantity: 10, price: 1080 },
        { quantity: 20, price: 1040 }
      ]
    },
    { 
      id: 28, 
      name: "Coconut Oil 5L", 
      category: "Oils", 
      price: 980,
      wholesalePrice: 900,
      stock: 70,
      moq: 1,
      unit: "bottle",
      description: "Pure coconut oil",
      image: "/images/Coconut oil.jpeg",
      bulkPricing: [
        { quantity: 1, price: 980 },
        { quantity: 5, price: 950 },
        { quantity: 10, price: 930 },
        { quantity: 20, price: 900 }
      ]
    },
    { 
      id: 29, 
      name: "Soybean Oil 5L", 
      category: "Oils", 
      price: 520,
      wholesalePrice: 460,
      stock: 95,
      moq: 3,
      unit: "bottle",
      description: "Refined soybean oil",
      bulkPricing: [
        { quantity: 1, price: 520 },
        { quantity: 5, price: 500 },
        { quantity: 10, price: 480 },
        { quantity: 20, price: 460 }
      ]
    },
    { 
      id: 30, 
      name: "Olive Oil 5L", 
      category: "Oils", 
      price: 1800,
      wholesalePrice: 1650,
      stock: 40,
      moq: 1,
      unit: "bottle",
      description: "Extra virgin olive oil",
      image: "/images/Olive oil.jpeg",
      bulkPricing: [
        { quantity: 1, price: 1800 },
        { quantity: 5, price: 1750 },
        { quantity: 10, price: 1700 },
        { quantity: 20, price: 1650 }
      ]
    },
    { 
      id: 31, 
      name: "Rice Bran Oil 5L", 
      category: "Oils", 
      price: 600,
      wholesalePrice: 540,
      stock: 80,
      moq: 2,
      unit: "bottle",
      description: "Refined rice bran oil",
      bulkPricing: [
        { quantity: 1, price: 600 },
        { quantity: 5, price: 580 },
        { quantity: 10, price: 560 },
        { quantity: 20, price: 540 }
      ]
    },
    { 
      id: 32, 
      name: "Vanaspati 10kg", 
      category: "Oils", 
      price: 980,
      wholesalePrice: 900,
      stock: 65,
      moq: 2,
      unit: "box",
      description: "Vanaspati ghee",
      bulkPricing: [
        { quantity: 1, price: 980 },
        { quantity: 5, price: 950 },
        { quantity: 10, price: 930 },
        { quantity: 20, price: 900 }
      ]
    },
    { 
      id: 33, 
      name: "Sesame Oil 5L", 
      category: "Oils", 
      price: 1250,
      wholesalePrice: 1140,
      stock: 50,
      moq: 1,
      unit: "bottle",
      description: "Cold-pressed sesame oil",
      bulkPricing: [
        { quantity: 1, price: 1250 },
        { quantity: 5, price: 1210 },
        { quantity: 10, price: 1180 },
        { quantity: 20, price: 1140 }
      ]
    },
    { 
      id: 34, 
      name: "Coriander Powder 2kg", 
      category: "Spices", 
      price: 280,
      wholesalePrice: 230,
      stock: 150,
      moq: 3,
      unit: "box",
      description: "Ground coriander powder",
      bulkPricing: [
        { quantity: 1, price: 280 },
        { quantity: 5, price: 265 },
        { quantity: 10, price: 250 },
        { quantity: 20, price: 230 }
      ]
    },
    { 
      id: 35, 
      name: "Cumin Seeds 5kg", 
      category: "Spices", 
      price: 950,
      wholesalePrice: 860,
      stock: 120,
      moq: 2,
      unit: "bag",
      description: "Whole cumin seeds",
      bulkPricing: [
        { quantity: 1, price: 950 },
        { quantity: 5, price: 920 },
        { quantity: 10, price: 890 },
        { quantity: 20, price: 860 }
      ]
    },
    { 
      id: 36, 
      name: "Black Pepper 1kg", 
      category: "Spices", 
      price: 700,
      wholesalePrice: 620,
      stock: 100,
      moq: 1,
      unit: "box",
      description: "Whole black pepper",
      image: "/images/Black pepper.jpeg",
      bulkPricing: [
        { quantity: 1, price: 700 },
        { quantity: 5, price: 680 },
        { quantity: 10, price: 650 },
        { quantity: 20, price: 620 }
      ]
    },
    { 
      id: 37, 
      name: "Garam Masala 1kg", 
      category: "Spices", 
      price: 650,
      wholesalePrice: 580,
      stock: 90,
      moq: 1,
      unit: "box",
      description: "Premium garam masala blend",
      image: "/images/Garam Masala.jpeg",
      bulkPricing: [
        { quantity: 1, price: 650 },
        { quantity: 5, price: 630 },
        { quantity: 10, price: 600 },
        { quantity: 20, price: 580 }
      ]
    },
    { 
      id: 38, 
      name: "Fenugreek 5kg", 
      category: "Spices", 
      price: 380,
      wholesalePrice: 320,
      stock: 140,
      moq: 2,
      unit: "bag",
      description: "Fenugreek (methi) seeds",
      bulkPricing: [
        { quantity: 1, price: 380 },
        { quantity: 5, price: 360 },
        { quantity: 10, price: 340 },
        { quantity: 20, price: 320 }
      ]
    },
    { 
      id: 39, 
      name: "Mustard Seeds 5kg", 
      category: "Spices", 
      price: 420,
      wholesalePrice: 360,
      stock: 130,
      moq: 2,
      unit: "bag",
      description: "Yellow mustard seeds",
      bulkPricing: [
        { quantity: 1, price: 420 },
        { quantity: 5, price: 400 },
        { quantity: 10, price: 380 },
        { quantity: 20, price: 360 }
      ]
    },
    { 
      id: 40, 
      name: "Red Chilli Whole 5kg", 
      category: "Spices", 
      price: 600,
      wholesalePrice: 540,
      stock: 110,
      moq: 2,
      unit: "bag",
      description: "Whole red chilli",
      bulkPricing: [
        { quantity: 1, price: 600 },
        { quantity: 5, price: 580 },
        { quantity: 10, price: 560 },
        { quantity: 20, price: 540 }
      ]
    },
    { 
      id: 41, 
      name: "Masala Peanuts 5kg", 
      category: "Snacks", 
      price: 520,
      wholesalePrice: 460,
      stock: 85,
      moq: 2,
      unit: "box",
      description: "Spicy roasted peanuts for bulk packs",
      bulkPricing: [
        { quantity: 1, price: 520 },
        { quantity: 5, price: 500 },
        { quantity: 10, price: 480 },
        { quantity: 20, price: 460 }
      ]
    },
    { 
      id: 42, 
      name: "Namkeen Mix 10kg", 
      category: "Snacks", 
      price: 780,
      wholesalePrice: 700,
      stock: 70,
      moq: 1,
      unit: "box",
      description: "Crunchy savoury mix for retail packs",
      bulkPricing: [
        { quantity: 1, price: 780 },
        { quantity: 5, price: 750 },
        { quantity: 10, price: 720 },
        { quantity: 20, price: 700 }
      ]
    },
    { 
      id: 43, 
      name: "Tea Time Cookies 12kg", 
      category: "Snacks", 
      price: 980,
      wholesalePrice: 880,
      stock: 60,
      moq: 1,
      unit: "box",
      description: "Assorted butter cookies for gifting and retail",
      bulkPricing: [
        { quantity: 1, price: 980 },
        { quantity: 5, price: 940 },
        { quantity: 10, price: 900 },
        { quantity: 20, price: 880 }
      ]
    },
  ]);

  const addProduct = (product) => {
    setProducts([...products, product]);
  };

  const updateProduct = (id, updatedProduct) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateStock = (id, newStock) => {
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
  };

  const getPriceForQuantity = (productId, quantity) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    // Find the applicable bulk price
    let applicablePrice = product.bulkPricing[0].price;
    for (let tier of product.bulkPricing) {
      if (quantity >= tier.quantity) {
        applicablePrice = tier.price;
      }
    }
    return applicablePrice;
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      addProduct, 
      updateProduct, 
      deleteProduct, 
      updateStock,
      getPriceForQuantity 
    }}>
      {children}
    </ProductContext.Provider>
  );
}