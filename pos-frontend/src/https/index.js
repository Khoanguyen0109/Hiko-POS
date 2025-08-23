import { axiosWrapper } from "./axiosWrapper";

// API Endpoints

// Auth Endpoints
export const login = (data) => axiosWrapper.post("/api/user/login", data);
export const register = (data) => axiosWrapper.post("/api/user/register", data);
export const getUserData = () => axiosWrapper.get("/api/user");
export const logout = () => axiosWrapper.post("/api/user/logout");

// Table Endpoints
export const addTable = (data) => axiosWrapper.post("/api/table/", data);
export const getTables = () => axiosWrapper.get("/api/table");
export const updateTable = ({ tableId, ...tableData }) =>
  axiosWrapper.put(`/api/table/${tableId}`, tableData);

// Payment Endpoints
export const createOrderRazorpay = (data) =>
  axiosWrapper.post("/api/payment/create-order", data);
export const verifyPaymentRazorpay = (data) =>
  axiosWrapper.post("/api/payment//verify-payment", data);

// Order Endpoints
export const addOrder = (data) => axiosWrapper.post("/api/order/", data);
export const getOrders = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.status && params.status !== 'all') queryParams.append('status', params.status);
  
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/order${queryString ? `?${queryString}` : ''}`);
};
export const updateOrderStatus = ({ orderId, orderStatus }) =>
  axiosWrapper.put(`/api/order/${orderId}`, { orderStatus });

// Category Endpoints
export const addCategory = (data) => axiosWrapper.post("/api/category/", data);
export const getCategories = () => axiosWrapper.get("/api/category");
export const getCategoryById = (categoryId) => axiosWrapper.get(`/api/category/${categoryId}`);
export const updateCategory = ({ categoryId, ...categoryData }) =>
  axiosWrapper.put(`/api/category/${categoryId}`, categoryData);
export const deleteCategory = (categoryId) => axiosWrapper.delete(`/api/category/${categoryId}`);

// Dish Endpoints
export const addDish = (data) => axiosWrapper.post("/api/dish/", data);
export const getDishes = () => axiosWrapper.get("/api/dish");
export const getAvailableDishes = () => axiosWrapper.get("/api/dish/available");
export const getDishesByCategory = (categoryId) => axiosWrapper.get(`/api/dish/category/${categoryId}`);
export const getDishById = (dishId) => axiosWrapper.get(`/api/dish/${dishId}`);
export const updateDish = ({ dishId, ...dishData }) =>
  axiosWrapper.put(`/api/dish/${dishId}`, dishData);
export const deleteDish = (dishId) => axiosWrapper.delete(`/api/dish/${dishId}`);
export const toggleDishAvailability = (dishId) => axiosWrapper.patch(`/api/dish/${dishId}/toggle-availability`);

// Customer Endpoints
export const addCustomer = (data) => axiosWrapper.post("/api/customer/", data);
export const getCustomers = () => axiosWrapper.get("/api/customer");
export const getCustomerById = (customerId) => axiosWrapper.get(`/api/customer/${customerId}`);
export const updateCustomer = ({ customerId, ...customerData }) =>
  axiosWrapper.put(`/api/customer/${customerId}`, customerData);
export const deleteCustomer = (customerId) => axiosWrapper.delete(`/api/customer/${customerId}`);
