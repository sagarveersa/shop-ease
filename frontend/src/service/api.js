import axios from "axios";
import camelcaseKeys from "camelcase-keys";
import snakecaseKeys from "snakecase-keys";

export const baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/";

export const baseApi = axios.create({
  baseURL: baseURL,
});

baseApi.interceptors.request.use((config) => {
  if (config.data) {
    config.data = snakecaseKeys(config.data, { deep: true });
  }

  return config;
});

baseApi.interceptors.response.use((response) => {
  response.data = camelcaseKeys(response.data, { deep: true });
  return response;
});

export const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth config for handling different auth methods
let auth0Instance = null;

/**
 * Setup API authentication for Auth0 or local auth
 * Call this from AuthProvider when the auth method is determined
 */
export function setupApiAuth(authConfig) {
  if (authConfig && authConfig.auth0) {
    auth0Instance = authConfig.auth0;
  } else {
    auth0Instance = null;
  }
}

api.interceptors.request.use((config) => {
  if (config.data) {
    if (typeof config.data === "string") {
      try {
        config.data = JSON.parse(config.data);
      } catch (error) {
        // NOT JSON leave it as it is
        console.error(
          "[Case Transpiler Interceptor] config.data is not JSON",
          error,
        );
      }
    }
    config.data = snakecaseKeys(config.data, { deep: true });
  }

  return config;
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  async (config) => {
    let token;

    if (auth0Instance) {
      // Auth0 flow: get token silently (handles caching and refresh)
      try {
        token = await auth0Instance.getAccessTokenSilently({
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        });
      } catch (error) {
        console.error(
          "[Request Interceptor] Failed to get Auth0 token:",
          error,
        );
        return Promise.reject(error);
      }
    } else {
      // Local auth flow: get token from localStorage
      token = localStorage.getItem("accessToken");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Refresh access token (for local auth only)
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onRefreshed(newAccessToken) {
  refreshSubscribers.forEach((callback) => callback(newAccessToken));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if not a 401 or if already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // _retry is custom attribute added to prevent infinite loop
    originalRequest._retry = true;

    // For Auth0: let it handle token refresh automatically via getAccessTokenSilently
    if (auth0Instance) {
      try {
        // Get fresh token from Auth0 (will refresh if needed)
        const newToken = await auth0Instance.getAccessTokenSilently({
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          cache: false,
        });
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        // Auth0 refresh failed - logout
        console.error(
          "[Response Interceptor] Auth0 token refresh failed:",
          err,
        );
        auth0Instance.logout({
          logoutParams: { returnTo: window.location.origin },
        });
        return Promise.reject(err);
      }
    }

    // For local auth: use refresh token to get new access token
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      console.log("[Response Interceptor] Trying to refresh the token...");
      const response = await axios.post(`${baseURL}accounts/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccessToken = response.data.access;
      const newRefreshToken = response.data.refresh;

      console.log(`[Response Interceptor] New access token: ${newAccessToken}`);
      // store new token
      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);

      // notify all queued requests
      onRefreshed(newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (error) {
      // refresh failed -> logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userID");
      localStorage.removeItem("name");
      localStorage.removeItem("isStaff");

      window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

api.interceptors.response.use((response) => {
  response.data = camelcaseKeys(response.data, { deep: true });
  return response;
});
