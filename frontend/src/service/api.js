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
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Refresh access token
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
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // _retry is custom attribute added to prevent infinite loop
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          resolve(api(originalRequest));
        }); // subscribeTokenRefresh call ends here
      }); // return statement ends here
    } // if ends here

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

      // window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }, // onRejection callback ends here
);

api.interceptors.response.use((response) => {
  response.data = camelcaseKeys(response.data, { deep: true });
  return response;
});
