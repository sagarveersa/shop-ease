import { createContext } from "react";
import { useState, useCallback, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { baseURL, setupApiAuth } from "../service/api";

// eslint-disable-next-line react-refresh/only-export-components
export const authContext = createContext();

function parseStoredIsStaff(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return false;
}

export function AuthProvider({ children, useAuth0Integration = false }) {
  const auth0 = useAuth0Integration ? useAuth0() : null;

  // Local auth state
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [userID, setUserID] = useState(localStorage.getItem("userID"));
  const [name, setName] = useState(localStorage.getItem("name"));
  const [isStaff, setIsStaff] = useState(
    parseStoredIsStaff(localStorage.getItem("isStaff")),
  );
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Setup API authentication based on auth method
  useEffect(() => {
    if (auth0 && !auth0.isLoading) {
      // Setup Auth0 for API interceptors
      setupApiAuth({ auth0 });
    } else if (!useAuth0Integration) {
      // Setup local auth for API interceptors (no Auth0)
      setupApiAuth(null);
    }
  }, [useAuth0Integration, auth0, auth0?.isLoading]);

  // Determine loggedIn status based on auth method
  const loggedIn = useAuth0Integration
    ? auth0?.isAuthenticated && !!userID
    : !!(token && userID && name);

  // Handle Auth0 authentication - exchange token for backend user data
  const handleAuth0TokenExchange = useCallback(
    async (auth0AccessToken, auth0User) => {
      setIsAuthLoading(true);
      setAuthError(null);
      try {
        // First, register/sync user with backend
        console.log("Auth0 token exchange: registering user", auth0User.email);
        await axios.post(
          `${baseURL}accounts/auth0/`,
          {
            email: auth0User.email,
            name: auth0User.name || auth0User.email.split("@")[0],
          },
          {
            headers: {
              Authorization: `Bearer ${auth0AccessToken}`,
            },
          },
        );

        // Then, get user authentication details from backend
        const response = await axios.get(
          `${baseURL}accounts/auth0/authenticate/`,
          {
            headers: {
              Authorization: `Bearer ${auth0AccessToken}`,
            },
          },
        );

        const { user_id, name: backendName, is_staff } = response.data;

        // Store in state and localStorage
        setToken(auth0AccessToken);
        localStorage.setItem("accessToken", auth0AccessToken);

        setUserID(user_id);
        localStorage.setItem("userID", user_id);

        setName(backendName);
        localStorage.setItem("name", backendName);

        setIsStaff(is_staff);
        localStorage.setItem("isStaff", is_staff);

        return true;
      } catch (error) {
        const errorMsg =
          error?.response?.data?.detail ||
          error?.message ||
          "Auth0 authentication failed";
        setAuthError(errorMsg);
        console.error("Auth0 token exchange failed:", error);
        return false;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [],
  );

  // Watch for Auth0 authentication changes
  useEffect(() => {
    if (useAuth0Integration && auth0?.isAuthenticated && !userID) {
      const exchangeToken = async () => {
        try {
          const accessToken = await auth0.getAccessTokenSilently({
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          });
          await handleAuth0TokenExchange(accessToken, auth0.user);
        } catch (error) {
          console.error("Error getting Auth0 access token:", error);
          setAuthError("Failed to get authentication token");
        }
      };

      exchangeToken();
    }
  }, [
    useAuth0Integration,
    auth0?.isAuthenticated,
    auth0,
    userID,
    handleAuth0TokenExchange,
  ]);

  const logout = useCallback(() => {
    if (useAuth0Integration) {
      // Clear local state first
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userID");
      localStorage.removeItem("name");
      localStorage.removeItem("isStaff");
      setToken(null);
      setUserID(null);
      setName(null);
      setIsStaff(false);

      // Then logout from Auth0
      auth0?.logout({ logoutParams: { returnTo: window.location.origin } });
    } else {
      // Local auth logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userID");
      localStorage.removeItem("name");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isStaff");
      setToken(null);
      setUserID(null);
      setName(null);
      setIsStaff(false);
    }
  }, [useAuth0Integration, auth0]);

  const value = {
    // Auth method flag
    useAuth0: useAuth0Integration,

    // Local auth fields
    token,
    userID,
    name,
    isStaff,
    loggedIn,

    // Loading and error states
    isAuthLoading,
    authError,

    // Auth0 fields (if using Auth0)
    auth0User: useAuth0Integration ? auth0?.user : null,
    auth0IsLoading: useAuth0Integration ? auth0?.isLoading : false,
    auth0Error: useAuth0Integration ? auth0?.error : null,

    // Setters for local auth
    setToken,
    setUserID,
    setName,
    setIsStaff,
    logout,

    // Auth0 methods (if using Auth0)
    loginWithAuth0: useAuth0Integration ? auth0?.loginWithRedirect : null,
  };

  return <authContext.Provider value={value}>{children}</authContext.Provider>;
}
