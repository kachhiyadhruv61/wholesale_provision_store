import { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const getBulkPrice = (product, quantity) => {
    if (!product?.bulkPricing || product.bulkPricing.length === 0) {
      return product.price || 0;
    }

    let price = product.bulkPricing[0].price;
    for (const tier of product.bulkPricing) {
      if (quantity >= tier.quantity) {
        price = tier.price;
      }
    }
    return price;
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      const incomingQty = product.quantity || 1;

      if (existingIndex !== -1) {
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingIndex];
        const newQuantity = (existingItem.quantity || 1) + incomingQty;
        const unitPrice = getBulkPrice(existingItem, newQuantity);

        updatedCart[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          price: unitPrice,
        };
        return updatedCart;
      }

      const unitPrice = getBulkPrice(product, incomingQty);
      return [...prevCart, { ...product, quantity: incomingQty, price: unitPrice }];
    });
  };

  const incrementQuantity = (index) => {
    setCart((prevCart) =>
      prevCart.map((item, i) => {
        if (i !== index) return item;

        const newQuantity = (item.quantity || 1) + 1;
        return {
          ...item,
          quantity: newQuantity,
          price: getBulkPrice(item, newQuantity),
        };
      })
    );
  };

  const decrementQuantity = (index) => {
    setCart((prevCart) => {
      const next = prevCart.map((item, i) => {
        if (i !== index) return item;

        const minQty = item.moq || 1;
        const newQuantity = Math.max((item.quantity || 1) - 1, minQty);
        return {
          ...item,
          quantity: newQuantity,
          price: getBulkPrice(item, newQuantity),
        };
      });

      return next;
    });
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const clearCart = () => {
  setCart([]);
};

  const totalPrice = cart.reduce(
    (total, item) => total + (item.price * (item.quantity || 1)),
    0
  );

  const deliveryCharge = totalPrice > 0 && totalPrice < 6000 ? 40 : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        totalPrice,
        deliveryCharge,
        clearCart,
        incrementQuantity,
        decrementQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
