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
    config.data = snakecaseKeys(config.data, { deep: true });
  }

  return config;
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    console.log("\nNew Request: ");
    console.log(
      `[Request Interceptor] Request intercepted:-> ${config._retry}`,
    );
    console.log("[Request Interceptor] Request object", config);
    if (token) {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
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
  (response) => {
    if (!response.config) {
      console.log(`In this response config is undefined`);
      // } else if (response.config._retry) {
      //   console.log(
      //     `Response of retry request intercepted ${originalRequest._retry}\nResponse is ${response}`,
      //   );
    } else {
      console.log(`Response is received`, response);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log("[Response Interceptor] Error - ", error);
    console.log(
      "[Response Interceptor] Extracting original request: ",
      originalRequest,
    );

    if (error.response?.status !== 401 || originalRequest._retry) {
      console.log(
        `[Response Interceptor] Response of retry request intercepted ${originalRequest._retry}`,
      );
      return Promise.reject(error);
    }
    // _retry is custom attribute added to prevent infinite loop
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        console.log("[Response Interceptor] Registering request in the queue");
        subscribeTokenRefresh((newAccessToken) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
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
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };

      console.log(
        "[Response Interceptor] sending retry request: ",
        originalRequest,
      );

      return api(originalRequest);
    } catch (error) {
      // refresh failed -> logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      window.location.href = "/login";
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
