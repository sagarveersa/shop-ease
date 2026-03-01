import { Auth0Provider } from "@auth0/auth0-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CheckoutProvider } from "./context/CheckoutContext";
import "./index.css";

// Toggle between Auth0 and local authentication
// Set to true to use Auth0, false to use local backend authentication
const USE_AUTH0_INTEGRATION = true;

// Auth0 audience used to request JWT access tokens
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || "";

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
    {USE_AUTH0_INTEGRATION ? (
      <Auth0Provider
        domain="dev-7xomy4uhs0tqwevo.us.auth0.com"
        clientId="nTGRPlnfNJGVIQHXcOG8bujH5MTJPAeH"
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: AUTH0_AUDIENCE,
          scope: "openid profile email",
        }}
      >
        <AuthProvider useAuth0Integration={true}>{renderApp}</AuthProvider>
      </Auth0Provider>
    ) : (
      <AuthProvider useAuth0Integration={false}>{renderApp}</AuthProvider>
    )}
  </React.StrictMode>,
);
