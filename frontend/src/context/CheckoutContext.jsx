import { createContext, useContext, useEffect } from "react";
import { authContext } from "./AuthContext";
import { useState } from "react";

export const checkoutContext = createContext();

export function CheckoutProvider({ children }) {
  const [checkoutProducts, setCheckoutProducts] = useState([]);
  const { loggedIn } = useContext(authContext);

  if (!loggedIn) {
    <checkoutContext.Provider
      value={{ checkoutProducts: null, setCheckoutProducts: null }}
    >
      {children}
    </checkoutContext.Provider>;
  }

  return (
    <checkoutContext.Provider value={{ checkoutProducts, setCheckoutProducts }}>
      {children}
    </checkoutContext.Provider>
  );
}
