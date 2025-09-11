import axios from "axios";
import { clearAuthData } from "../utils/auth";

const defaultHeader = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api",
  headers: { ...defaultHeader },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear localStorage and redirect to login
      clearAuthData();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export const axiosWrapper = axiosInstance;
