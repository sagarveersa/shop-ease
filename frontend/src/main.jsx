import { Auth0Provider } from "@auth0/auth0-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CheckoutProvider } from "./context/CheckoutContext";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-7xomy4uhs0tqwevo.us.auth0.com"
      clientId="nTGRPlnfNJGVIQHXcOG8bujH5MTJPAeH"
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <AuthProvider>
        <CartProvider>
          <CheckoutProvider>
            <App />,
          </CheckoutProvider>
        </CartProvider>
      </AuthProvider>
      ,
    </Auth0Provider>
  </React.StrictMode>,
);
