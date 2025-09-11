import axios from "axios";

const defaultHeader = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const axiosWrapper = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api",
  withCredentials: true,
  headers: { ...defaultHeader },
});
