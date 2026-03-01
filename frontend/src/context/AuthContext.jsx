import { createContext } from "react";
import { useCallback, useEffect, useState } from "react";
import { setupApiAuth } from "../service/api";

// eslint-disable-next-line react-refresh/only-export-components
export const authContext = createContext();

function parseStoredIsStaff(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return false;
}

function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userID");
  localStorage.removeItem("name");
  localStorage.removeItem("isStaff");
}

function consumeOauthCallbackParams() {
  const params = new URLSearchParams(window.location.search);
  const hasSuccess = params.get("oauth_success") === "1";
  const oauthError = params.get("oauth_error");

  if (!hasSuccess && !oauthError) {
    return { handled: false };
  }

  if (oauthError) {
    return {
      handled: true,
      success: false,
      error: oauthError,
    };
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const userID = params.get("user_id");
  const name = params.get("name");
  const isStaff = params.get("is_staff") === "true";

  if (!accessToken || !refreshToken || !userID || !name) {
    return {
      handled: true,
      success: false,
      error: "OAuth callback payload is incomplete.",
    };
  }

  return {
    handled: true,
    success: true,
    payload: {
      accessToken,
      refreshToken,
      userID,
      name,
      isStaff,
    },
  };
}

function clearUrlQueryString() {
  const { pathname, hash } = window.location;
  window.history.replaceState({}, document.title, `${pathname}${hash || ""}`);
}

export function AuthProvider({ children, useAuth0Integration = false }) {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [userID, setUserID] = useState(localStorage.getItem("userID"));
  const [name, setName] = useState(localStorage.getItem("name"));
  const [isStaff, setIsStaff] = useState(
    parseStoredIsStaff(localStorage.getItem("isStaff")),
  );
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    setupApiAuth(null);
  }, []);

  useEffect(() => {
    const callbackResult = consumeOauthCallbackParams();
    if (!callbackResult.handled) {
      return;
    }

    clearUrlQueryString();

    if (!callbackResult.success) {
      clearAuthStorage();
      setToken(null);
      setUserID(null);
      setName(null);
      setIsStaff(false);
      setAuthError(callbackResult.error || "OAuth login failed.");
      return;
    }

    const payload = callbackResult.payload;
    localStorage.setItem("accessToken", payload.accessToken);
    localStorage.setItem("refreshToken", payload.refreshToken);
    localStorage.setItem("userID", payload.userID);
    localStorage.setItem("name", payload.name);
    localStorage.setItem("isStaff", String(payload.isStaff));

    setToken(payload.accessToken);
    setUserID(payload.userID);
    setName(payload.name);
    setIsStaff(payload.isStaff);
    setAuthError(null);
  }, []);

  const loggedIn = !!(token && userID && name);

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUserID(null);
    setName(null);
    setIsStaff(false);
    setAuthError(null);
  }, []);

  const loginWithAuth0 = useCallback((options = {}) => {
    const screenHint = options?.authorizationParams?.screen_hint;
    const url = new URL(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/"}accounts/oauth/authorize/`,
    );

    if (screenHint) {
      url.searchParams.set("screen_hint", screenHint);
    }

    setIsAuthLoading(true);
    window.location.assign(url.toString());
  }, []);

  const value = {
    useAuth0: useAuth0Integration,
    token,
    userID,
    name,
    isStaff,
    loggedIn,
    isAuthLoading,
    authError,
    setToken,
    setUserID,
    setName,
    setIsStaff,
    logout,
    loginWithAuth0: useAuth0Integration ? loginWithAuth0 : null,
    auth0User: null,
    auth0IsLoading: false,
    auth0Error: null,
  };

  return <authContext.Provider value={value}>{children}</authContext.Provider>;
}
