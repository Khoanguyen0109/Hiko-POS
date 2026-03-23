import axios from "axios";
import { clearAuthData, getAuthToken } from "../utils/auth";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // keep sending the httpOnly cookie as fallback for same-site dev
});

// Attach auth token + active store context header on every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

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
