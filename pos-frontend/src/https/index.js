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
export const processCashPayment = (data) =>
  axiosWrapper.post("/api/payment/cash", data);
export const getPaymentByOrderId = (orderId) =>
  axiosWrapper.get(`/api/payment/order/${orderId}`);
export const getAllPayments = (params) =>
  axiosWrapper.get("/api/payment", { params });

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
export const deleteOrder = (orderId) => axiosWrapper.delete(`/api/order/${orderId}`);

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

// Spending Endpoints
export {
  addSpending,
  getSpending,
  getSpendingById,
  updateSpending,
  deleteSpending,
  addSpendingCategory,
  getSpendingCategories,
  getSpendingCategoryById,
  updateSpendingCategory,
  deleteSpendingCategory,
  addVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  getSpendingDashboard,
  getSpendingAnalytics
} from "./spendingApi";

// Ingredient Endpoints
export const addIngredient = (data) => axiosWrapper.post("/api/ingredient/", data);
export const getIngredients = (params) => axiosWrapper.get("/api/ingredient", { params });
export const getIngredientById = (id) => axiosWrapper.get(`/api/ingredient/${id}`);
export const updateIngredient = ({ ingredientId, ...data }) => 
  axiosWrapper.put(`/api/ingredient/${ingredientId}`, data);
export const deleteIngredient = (id) => axiosWrapper.delete(`/api/ingredient/${id}`);
export const getLowStockIngredients = () => axiosWrapper.get("/api/ingredient/low-stock");
export const getIngredientHistory = (id, params) => 
  axiosWrapper.get(`/api/ingredient/${id}/history`, { params });

// Ingredient Transaction Endpoints
export const importIngredient = (data) => axiosWrapper.post("/api/ingredient-transaction/import", data);
export const exportIngredient = (data) => axiosWrapper.post("/api/ingredient-transaction/export", data);
export const adjustIngredient = (data) => axiosWrapper.post("/api/ingredient-transaction/adjust", data);
export const getIngredientTransactions = (params) => 
  axiosWrapper.get("/api/ingredient-transaction", { params });
export const getTransactionById = (id) => axiosWrapper.get(`/api/ingredient-transaction/${id}`);
export const deleteIngredientTransaction = (id) => axiosWrapper.delete(`/api/ingredient-transaction/${id}`);

// Recipe Endpoints
export const createOrUpdateRecipe = (data) => axiosWrapper.post("/api/recipe/", data);
export const getAllRecipes = (params) => axiosWrapper.get("/api/recipe", { params });
export const getRecipeByDishId = (dishId) => axiosWrapper.get(`/api/recipe/dish/${dishId}`);
export const deleteRecipe = (dishId) => axiosWrapper.delete(`/api/recipe/dish/${dishId}`);
export const recalculateAllCosts = () => axiosWrapper.post("/api/recipe/recalculate-all");
export const calculateDishCost = (dishId, params) => axiosWrapper.get(`/api/recipe/dish/${dishId}/cost`, { params });
export const exportIngredientsForOrder = (data) => axiosWrapper.post("/api/recipe/export-for-order", data);
export const checkIngredientAvailability = (data) => axiosWrapper.post("/api/recipe/check-availability", data);

// Topping Recipe Endpoints
export const createOrUpdateToppingRecipe = (data) => axiosWrapper.post("/api/topping-recipe/", data);
export const getAllToppingRecipes = (params) => axiosWrapper.get("/api/topping-recipe", { params });
export const getToppingRecipeByToppingId = (toppingId) => axiosWrapper.get(`/api/topping-recipe/topping/${toppingId}`);
export const deleteToppingRecipe = (toppingId) => axiosWrapper.delete(`/api/topping-recipe/topping/${toppingId}`);
export const calculateToppingRecipeCost = (toppingId, params) => axiosWrapper.get(`/api/topping-recipe/topping/${toppingId}/cost`, { params });
export const recalculateAllToppingCosts = () => axiosWrapper.post("/api/topping-recipe/recalculate-all");
export const cloneToppingRecipe = (toppingId, data) => axiosWrapper.post(`/api/topping-recipe/topping/${toppingId}/clone`, data);
