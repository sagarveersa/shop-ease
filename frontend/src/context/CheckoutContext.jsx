import { createContext, useContext, useEffect } from "react";
import { authContext } from "./AuthContext";
import { useState } from "react";

export const checkoutContext = createContext();

export function CheckoutProvider({ children }) {
  const [checkoutItems, setCheckoutItems] = useState([]);
  const { loggedIn } = useContext(authContext);

  useEffect(() => {
    console.log("CheckoutProducts", checkoutItems);
  }, [checkoutItems]);

  if (!loggedIn) {
    <checkoutContext.Provider
      value={{ checkoutItems: null, setCheckoutItems: null }}
    >
      {children}
    </checkoutContext.Provider>;
  }

  return (
    <checkoutContext.Provider value={{ checkoutItems, setCheckoutItems }}>
      {children}
    </checkoutContext.Provider>
  );
}
