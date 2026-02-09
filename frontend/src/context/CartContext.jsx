import { createContext, useContext, useEffect } from "react";
import { ProductService } from "../service/product.service";
import { authContext } from "./AuthContext";
import { useState } from "react";

export const cartContext = createContext();

export function CartProvider({ children }) {
  const { loggedIn, token } = useContext(authContext);
  // cart is the local state of the cart and syncedCart is the most recent local state 
  // that has successfully been synced with the backend
  const [cart, setCart] = useState({});
  const [syncedCart, setSyncedCart] = useState({});
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      if (!loggedIn) return;
      setLoading(true);
      const response = await ProductService.getCart(token);
      setLoading(false);

      if (!response.success) {
        setError(response.data.error);
      } else {
        setSyncedCart(response.data.items);
        setCart(response.data.items);
        setError(null);
      }
    };

    fetchCart();
  }, [loggedIn, token]);

  useEffect(() => {
    if (!loggedIn) return;
    if (!loading) {
      let newTotalItems = 0;
      let newTotalPrice = 0;
      for (const productID of Object.keys(cart)) {
        newTotalItems += cart[productID].qty;
        newTotalPrice += cart[productID].qty * cart[productID].price;
      }

      setTotalItems(newTotalItems);
      setTotalPrice(newTotalPrice);
    }
  }, [cart, syncedCart, loading, loggedIn]);

  const rollBackCartToSyncedCart = () => {
    setCart(syncedCart);
  };

  const addToCart = (product) => {
    const asyncAddToCart = async () => {
      const prevQty = cart[product.id] ? cart[product.id].qty : 0;

      setCart((prev) => {
        if (prev[product.id]) {
          return {
            ...prev,
            [product.id]: {
              ...prev[product.id],
              qty: prev[product.id].qty + 1,
            },
          };
        } else {
          return { ...prev, [product.id]: { ...product, qty: 1 } };
        }
      });

      // sync backend
      const response = await ProductService.updateCart(
        token,
        product.id,
        prevQty + 1,
      );

      if (!response.success) {
        // revert back the state
        setError(response.data.error);
        rollBackCartToSyncedCart();
        return;
      }

      // if request succeeds update syncedCart
      setSyncedCart((prev) => {
        if (prev[product.id]) {
          return {
            ...prev,
            [product.id]: {
              ...prev[product.id],
              qty: prev[product.id].qty + 1,
            },
          };
        } else {
          return { ...prev, [product.id]: { ...product, qty: 1 } };
        }
      });
    };

    asyncAddToCart();
  };

  const removeFromCart = (product) => {
    const asyncRemoveFromCart = async () => {
      // update the state
      const prevQty = cart[product.id].qty;
      if (prevQty === 0) {
        console.log("Inconsistent cart state - quantity can't be 0");
        return;
      }
      setCart((prev) => {
        if (!prev[product.id]) return prev;
        else if (prevQty === 1) {
          const { [product.id]: _, ...rest } = prev;
          return rest;
        } else {
          return {
            ...prev,
            [product.id]: { ...prev[product.id], qty: prevQty - 1 },
          };
        }
      });

      // sync the backend
      const response = await ProductService.updateCart(
        token,
        product.id,
        prevQty - 1,
      );
      if (!response.success) {
        // revert back the state
        setError(response.data.error);
        rollBackCartToSyncedCart();
        return;
      }

      // if request succeeds update synced cart
      setSyncedCart((prev) => {
        if (!prev[product.id]) return prev;
        else if (prevQty === 1) {
          const { [product.id]: _, ...rest } = prev;
          return rest;
        } else {
          return {
            ...prev,
            [product.id]: { ...prev[product.id], qty: prevQty - 1 },
          };
        }
      });
    };

    asyncRemoveFromCart();
  };

  if (!loggedIn) {
    return (
      <cartContext.Provider
        value={{
          cart: null,
          loading: null,
          error: null,
          setError: null,
          totalItems: null,
          totalPrice: null,
          addToCart: null,
          removeFromCart: null,
        }}
      >
        {children}
      </cartContext.Provider>
    );
  }

  return (
    <cartContext.Provider
      value={{
        cart: cart,
        loading: loading,
        error: error,
        setError: setError,
        totalItems: totalItems,
        totalPrice: totalPrice,
        addToCart: addToCart,
        removeFromCart: removeFromCart,
      }}
    >
      {children}
    </cartContext.Provider>
  );
}
