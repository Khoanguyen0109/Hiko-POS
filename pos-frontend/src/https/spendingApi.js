import { axiosWrapper } from "./axiosWrapper";

// ==================== SPENDING CRUD OPERATIONS ====================

// Create spending record
export const addSpending = (data) => axiosWrapper.post("/api/spending/", data);

// Get all spending records with filters
export const getSpending = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/spending${queryString ? `?${queryString}` : ''}`);
};

// Get spending record by ID
export const getSpendingById = (spendingId) => axiosWrapper.get(`/api/spending/${spendingId}`);

// Update spending record
export const updateSpending = ({ spendingId, ...spendingData }) =>
  axiosWrapper.put(`/api/spending/${spendingId}`, spendingData);

// Delete spending record
export const deleteSpending = (spendingId) => axiosWrapper.delete(`/api/spending/${spendingId}`);

// ==================== SPENDING CATEGORY OPERATIONS ====================

// Create spending category
export const addSpendingCategory = (data) => axiosWrapper.post("/api/spending/categories/", data);

// Get all spending categories
export const getSpendingCategories = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/spending/categories${queryString ? `?${queryString}` : ''}`);
};

// Get spending category by ID
export const getSpendingCategoryById = (categoryId) => axiosWrapper.get(`/api/spending/categories/${categoryId}`);

// Update spending category
export const updateSpendingCategory = ({ categoryId, ...categoryData }) =>
  axiosWrapper.put(`/api/spending/categories/${categoryId}`, categoryData);

// Delete spending category
export const deleteSpendingCategory = (categoryId) => axiosWrapper.delete(`/api/spending/categories/${categoryId}`);

// ==================== VENDOR OPERATIONS ====================

// Create vendor
export const addVendor = (data) => axiosWrapper.post("/api/spending/vendors/", data);

// Get all vendors
export const getVendors = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/spending/vendors${queryString ? `?${queryString}` : ''}`);
};

// Get vendor by ID
export const getVendorById = (vendorId) => axiosWrapper.get(`/api/spending/vendors/${vendorId}`);

// Update vendor
export const updateVendor = ({ vendorId, ...vendorData }) =>
  axiosWrapper.put(`/api/spending/vendors/${vendorId}`, vendorData);

// Delete vendor
export const deleteVendor = (vendorId) => axiosWrapper.delete(`/api/spending/vendors/${vendorId}`);

// ==================== ANALYTICS OPERATIONS ====================

// Get spending dashboard data
export const getSpendingDashboard = () => axiosWrapper.get("/api/spending/analytics/dashboard");

// Get detailed spending analytics
export const getSpendingAnalytics = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  return axiosWrapper.get(`/api/spending/analytics/reports${queryString ? `?${queryString}` : ''}`);
};
