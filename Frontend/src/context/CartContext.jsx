import { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart([...cart, product]);
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

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, totalPrice, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}
