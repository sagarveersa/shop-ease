import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CheckoutProvider } from "./context/CheckoutContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <AuthProvider>
    <CartProvider>
      <CheckoutProvider>
        <App />,
      </CheckoutProvider>
    </CartProvider>
  </AuthProvider>,
  // </React.StrictMode>
);
