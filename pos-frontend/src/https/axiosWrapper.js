import axios from "axios";
import { clearAuthData } from "../utils/auth";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // send httpOnly auth cookie on every request
});

// Attach active store context header on every request
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const activeStore = JSON.parse(localStorage.getItem("activeStore"));
      if (activeStore?._id) {
        config.headers["X-Store-Id"] = activeStore._id;
      }
    } catch {
      // ignore parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401, clear local auth cache and redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthData();
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export const axiosWrapper = axiosInstance;
