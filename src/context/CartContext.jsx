import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../data/products';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('mangaalam_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [stockMap, setStockMap] = useState({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mangaalam_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  // Fetch live products & inventory from backend
  const refreshProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch from server');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        const stocks = {};
        for (const p of data.products) {
          stocks[p.id] = p.stock;
        }
        setStockMap(stocks);

        // Merge backend inventory with frontend rich scent pyramid/notes
        setProducts(prevProducts => {
          return prevProducts.map(fp => {
            const backendMatch = data.products.find(bp => bp.id === fp.id);
            if (backendMatch) {
              return {
                ...fp,
                stock: backendMatch.stock,
                inStock: backendMatch.stock > 0,
                price: backendMatch.price,
                formattedPrice: `₹${backendMatch.price}`
              };
            }
            return fp;
          });
        });
      }
    } catch (err) {
      console.warn('Using local catalog fallback for inventory:', err.message);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const addToCart = (product, quantity = 1) => {
    // Check available stock from live backend state
    const availableStock = stockMap[product.id] !== undefined ? stockMap[product.id] : (product.stock || 25);

    if (availableStock <= 0) {
      setToastMessage(`Sorry, ${product.name} is currently out of stock.`);
      setTimeout(() => setToastMessage(null), 3500);
      return false;
    }

    let limitReached = false;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + quantity;

      if (targetQty > availableStock) {
        limitReached = true;
        const allowableAdd = availableStock - currentQty;
        if (allowableAdd <= 0) return prevCart;
        return existing
          ? prevCart.map(item => item.id === product.id ? { ...item, quantity: availableStock } : item)
          : [...prevCart, { ...product, quantity: allowableAdd }];
      }

      if (existing) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });

    if (limitReached) {
      setToastMessage(`Only ${availableStock} units of ${product.name} (${product.size}) are in stock.`);
    } else {
      setToastMessage(`Added ${product.name} (${product.size}) to your bag`);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);

    return true;
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    const availableStock = stockMap[id] !== undefined ? stockMap[id] : 25;

    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty > availableStock) {
              setToastMessage(`Maximum available stock reached (${availableStock} units).`);
              setTimeout(() => setToastMessage(null), 3000);
              return { ...item, quantity: availableStock };
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        products,
        stockMap,
        isLoadingProducts,
        refreshProducts,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        confirmedOrder,
        setConfirmedOrder,
        toastMessage,
        setToastMessage
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
