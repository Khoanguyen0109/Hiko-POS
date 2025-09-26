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
  if (params.createdBy && params.createdBy !== 'all') queryParams.append('createdBy', params.createdBy);
  if (params.paymentMethod && params.paymentMethod !== 'all') queryParams.append('paymentMethod', params.paymentMethod);
  if (params.thirdPartyVendor && params.thirdPartyVendor !== 'all') queryParams.append('thirdPartyVendor', params.thirdPartyVendor);
  
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/order${queryString ? `?${queryString}` : ''}`);
};
export const getOrderById = (orderId) => axiosWrapper.get(`/api/order/${orderId}`);
export const updateOrderStatus = ({ orderId, orderStatus, paymentMethod }) => {
  const updateData = {};
  if (orderStatus !== undefined) updateData.orderStatus = orderStatus;
  if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
  return axiosWrapper.put(`/api/order/${orderId}`, updateData);
};

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

// Member Management Endpoints
export const getAllMembers = () => axiosWrapper.get("/api/member/");
export const getMemberById = (id) => axiosWrapper.get(`/api/member/${id}`);
export const createMember = (data) => axiosWrapper.post("/api/member/", data);
export const updateMember = (id, data) => axiosWrapper.put(`/api/member/${id}`, data);
export const deleteMember = (id) => axiosWrapper.delete(`/api/member/${id}`);

// Member Profile Endpoints
export const getOwnProfile = () => axiosWrapper.get("/api/member/profile");
export const updateOwnProfile = (data) => axiosWrapper.put("/api/member/profile", data);
export const changePassword = (data) => axiosWrapper.put("/api/member/change-password", data);

// Topping Endpoints
export const getToppings = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append('category', params.category);
  if (params.available !== undefined) queryParams.append('available', params.available);
  if (params.sort) queryParams.append('sort', params.sort);
  
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/topping${queryString ? `?${queryString}` : ''}`);
};
export const getToppingsByCategory = () => axiosWrapper.get("/api/topping/by-category");
export const getToppingById = (toppingId) => axiosWrapper.get(`/api/topping/${toppingId}`);
export const addTopping = (data) => axiosWrapper.post("/api/topping/", data);
export const updateTopping = ({ toppingId, ...toppingData }) =>
  axiosWrapper.put(`/api/topping/${toppingId}`, toppingData);
export const deleteTopping = (toppingId) => axiosWrapper.delete(`/api/topping/${toppingId}`);
export const toggleToppingAvailability = (toppingId) => axiosWrapper.patch(`/api/topping/${toppingId}/toggle-availability`);

// Promotion Endpoints
export const getPromotions = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/promotion${queryString ? `?${queryString}` : ''}`);
};
export const getPromotionById = (promotionId) => axiosWrapper.get(`/api/promotion/${promotionId}`);
export const addPromotion = (data) => axiosWrapper.post("/api/promotion/", data);
export const updatePromotion = ({ promotionId, ...promotionData }) =>
  axiosWrapper.put(`/api/promotion/${promotionId}`, promotionData);
export const deletePromotion = (promotionId) => axiosWrapper.delete(`/api/promotion/${promotionId}`);
export const togglePromotionStatus = (promotionId) => axiosWrapper.patch(`/api/promotion/${promotionId}/toggle-status`);
export const getPromotionAnalytics = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/promotion/analytics${queryString ? `?${queryString}` : ''}`);
};
export const validateCouponCode = (code) => axiosWrapper.post("/api/promotion/validate-coupon", { code });
