import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CheckoutProvider } from "./context/CheckoutContext";
import "./index.css";
import { initAnalytics } from "./utils/analytics";

initAnalytics();

// Toggle between Auth0 and local authentication
// Set to true to use Auth0, false to use local backend authentication
const USE_AUTH0_INTEGRATION = true;

const root = ReactDOM.createRoot(document.getElementById("root"));

const renderApp = (
  <CartProvider>
    <CheckoutProvider>
      <App />
    </CheckoutProvider>
  </CartProvider>
);

root.render(
  <React.StrictMode>
    <AuthProvider useAuth0Integration={USE_AUTH0_INTEGRATION}>
      {renderApp}
    </AuthProvider>
  </React.StrictMode>,
);
