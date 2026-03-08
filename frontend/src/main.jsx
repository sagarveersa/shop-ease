import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CheckoutProvider } from "./context/CheckoutContext";
import "./index.css";
import mixpanel from "mixpanel-browser";

const MIXPANEL_PROJECT_TOKEN = import.meta.env.VITE_MIXPANEL_PROJECT_TOKEN;
const hasValidMixpanelToken =
  typeof MIXPANEL_PROJECT_TOKEN === "string" &&
  MIXPANEL_PROJECT_TOKEN.trim().length > 0;

if (hasValidMixpanelToken) {
  mixpanel.init(MIXPANEL_PROJECT_TOKEN, {
    track_pageview: true,
    autocapture: true,
    record_sessions_percent: 100,
    record_heatmap_data: true,
    api_host: import.meta.env.DEV
      ? "/mixpanel"
      : "https://api-js.mixpanel.com",
  });

  mixpanel.track("App Loaded");
} else {
  console.warn("Mixpanel is disabled: missing VITE_MIXPANEL_PROJECT_TOKEN");
}

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
