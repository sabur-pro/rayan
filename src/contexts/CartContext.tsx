import React, { createContext, useContext, useState, useCallback } from 'react';
import { CartItem, MarketProduct } from '../types/market';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: MarketProduct) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getCartQuantity: (productId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: MarketProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.ID === product.ID);
      if (existing) {
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.ID !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.ID === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getTotalPrice = useCallback((): number => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const getTotalItems = useCallback((): number => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const getCartQuantity = useCallback(
    (productId: number): number => {
      const item = cart.find((item) => item.product.ID === productId);
      return item ? item.quantity : 0;
    },
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        getCartQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
