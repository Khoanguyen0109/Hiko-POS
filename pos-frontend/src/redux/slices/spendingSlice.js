import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
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
} from "../../https";

// ==================== SPENDING ASYNC THUNKS ====================

export const fetchSpending = createAsyncThunk("spending/fetchAll", async (params = {}, thunkAPI) => {
  try {
    const { data } = await getSpending(params);
    return {
      items: data.data || [],
      pagination: data.pagination || {}
    };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch spending records");
  }
});

export const fetchSpendingById = createAsyncThunk("spending/fetchById", async (spendingId, thunkAPI) => {
  try {
    const { data } = await getSpendingById(spendingId);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch spending record");
  }
});

export const createSpending = createAsyncThunk("spending/create", async (spendingData, thunkAPI) => {
  try {
    const { data } = await addSpending(spendingData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create spending record");
  }
});

export const editSpending = createAsyncThunk("spending/update", async ({ spendingId, ...updates }, thunkAPI) => {
  try {
    const { data } = await updateSpending({ spendingId, ...updates });
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update spending record");
  }
});

export const removeSpending = createAsyncThunk("spending/delete", async (spendingId, thunkAPI) => {
  try {
    await deleteSpending(spendingId);
    return spendingId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete spending record");
  }
});

// ==================== CATEGORY ASYNC THUNKS ====================

export const fetchSpendingCategories = createAsyncThunk("spending/categories/fetchAll", async (params = {}, thunkAPI) => {
  try {
    const { data } = await getSpendingCategories(params);
    return data.data || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch spending categories");
  }
});

export const fetchSpendingCategoryById = createAsyncThunk("spending/categories/fetchById", async (categoryId, thunkAPI) => {
  try {
    const { data } = await getSpendingCategoryById(categoryId);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch spending category");
  }
});

export const createSpendingCategory = createAsyncThunk("spending/categories/create", async (categoryData, thunkAPI) => {
  try {
    const { data } = await addSpendingCategory(categoryData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create spending category");
  }
});

export const editSpendingCategory = createAsyncThunk("spending/categories/update", async ({ categoryId, ...updates }, thunkAPI) => {
  try {
    const { data } = await updateSpendingCategory({ categoryId, ...updates });
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update spending category");
  }
});

export const removeSpendingCategory = createAsyncThunk("spending/categories/delete", async (categoryId, thunkAPI) => {
  try {
    await deleteSpendingCategory(categoryId);
    return categoryId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete spending category");
  }
});

// ==================== VENDOR ASYNC THUNKS ====================

export const fetchVendors = createAsyncThunk("spending/vendors/fetchAll", async (params = {}, thunkAPI) => {
  try {
    const { data } = await getVendors(params);
    return data.data || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch vendors");
  }
});

export const fetchVendorById = createAsyncThunk("spending/vendors/fetchById", async (vendorId, thunkAPI) => {
  try {
    const { data } = await getVendorById(vendorId);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch vendor");
  }
});

export const createVendor = createAsyncThunk("spending/vendors/create", async (vendorData, thunkAPI) => {
  try {
    const { data } = await addVendor(vendorData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create vendor");
  }
});

export const editVendor = createAsyncThunk("spending/vendors/update", async ({ vendorId, ...updates }, thunkAPI) => {
  try {
    const { data } = await updateVendor({ vendorId, ...updates });
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update vendor");
  }
});

export const removeVendor = createAsyncThunk("spending/vendors/delete", async (vendorId, thunkAPI) => {
  try {
    await deleteVendor(vendorId);
    return vendorId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete vendor");
  }
});

// ==================== ANALYTICS ASYNC THUNKS ====================

export const fetchSpendingDashboard = createAsyncThunk("spending/analytics/fetchDashboard", async (params = {}, thunkAPI) => {
  try {
    // Use analytics API with date filtering support instead of basic dashboard
    const { data } = await getSpendingAnalytics(params);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch spending dashboard");
  }
});

export const fetchSpendingAnalytics = createAsyncThunk("spending/analytics/fetchReports", async (params = {}, thunkAPI) => {
  try {
    const { data } = await getSpendingAnalytics(params);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch spending analytics");
  }
});

// ==================== INITIAL STATE ====================

const initialState = {
  // Spending records
  items: [],
  currentSpending: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  
  // Categories
  categories: [],
  currentCategory: null,
  
  // Vendors
  vendors: [],
  currentVendor: null,
  
  // Analytics
  dashboardData: null,
  analyticsData: null,
  
  // UI State
  loading: false,
  categoriesLoading: false,
  vendorsLoading: false,
  dashboardLoading: false,
  analyticsLoading: false,
  
  // Error handling
  error: null,
  categoriesError: null,
  vendorsError: null,
  dashboardError: null,
  analyticsError: null,
  
  // Filters
  filters: {
    startDate: null,
    endDate: null,
    categoryId: null,
    vendorId: null,
    paymentStatus: 'all',
    minAmount: null,
    maxAmount: null
  }
};

// ==================== SLICE DEFINITION ====================

const spendingSlice = createSlice({
  name: "spending",
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
    },
    clearCategoriesError: (state) => {
      state.categoriesError = null;
    },
    clearVendorsError: (state) => {
      state.vendorsError = null;
    },
    clearDashboardError: (state) => {
      state.dashboardError = null;
    },
    clearAnalyticsError: (state) => {
      state.analyticsError = null;
    },
    
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Clear current items
    clearCurrentSpending: (state) => {
      state.currentSpending = null;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
    clearCurrentVendor: (state) => {
      state.currentVendor = null;
    },
    
    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // ==================== SPENDING RECORDS ====================
      
      // Fetch spending records
      .addCase(fetchSpending.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpending.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSpending.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch spending records";
      })
      
      // Fetch spending by ID
      .addCase(fetchSpendingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpendingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSpending = action.payload;
      })
      .addCase(fetchSpendingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch spending record";
        state.currentSpending = null;
      })
      
      // Create spending
      .addCase(createSpending.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSpending.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createSpending.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create spending record";
      })
      
      // Update spending
      .addCase(editSpending.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex(item => item._id === updated._id);
        if (idx !== -1) {
          state.items[idx] = updated;
        }
        if (state.currentSpending && state.currentSpending._id === updated._id) {
          state.currentSpending = updated;
        }
      })
      
      // Delete spending
      .addCase(removeSpending.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter(item => item._id !== id);
        if (state.currentSpending && state.currentSpending._id === id) {
          state.currentSpending = null;
        }
      })
      
      // ==================== CATEGORIES ====================
      
      // Fetch categories
      .addCase(fetchSpendingCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(fetchSpendingCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchSpendingCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload || "Failed to fetch categories";
      })
      
      // Fetch category by ID
      .addCase(fetchSpendingCategoryById.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(fetchSpendingCategoryById.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchSpendingCategoryById.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload || "Failed to fetch category";
        state.currentCategory = null;
      })
      
      // Create category
      .addCase(createSpendingCategory.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(createSpendingCategory.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories.unshift(action.payload);
      })
      .addCase(createSpendingCategory.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload || "Failed to create category";
      })
      
      // Update category
      .addCase(editSpendingCategory.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.categories.findIndex(cat => cat._id === updated._id);
        if (idx !== -1) {
          state.categories[idx] = updated;
        }
        if (state.currentCategory && state.currentCategory._id === updated._id) {
          state.currentCategory = updated;
        }
      })
      
      // Delete category
      .addCase(removeSpendingCategory.fulfilled, (state, action) => {
        const id = action.payload;
        state.categories = state.categories.filter(cat => cat._id !== id);
        if (state.currentCategory && state.currentCategory._id === id) {
          state.currentCategory = null;
        }
      })
      
      // ==================== VENDORS ====================
      
      // Fetch vendors
      .addCase(fetchVendors.pending, (state) => {
        state.vendorsLoading = true;
        state.vendorsError = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.vendorsLoading = false;
        state.vendors = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.vendorsLoading = false;
        state.vendorsError = action.payload || "Failed to fetch vendors";
      })
      
      // Fetch vendor by ID
      .addCase(fetchVendorById.pending, (state) => {
        state.vendorsLoading = true;
        state.vendorsError = null;
      })
      .addCase(fetchVendorById.fulfilled, (state, action) => {
        state.vendorsLoading = false;
        state.currentVendor = action.payload;
      })
      .addCase(fetchVendorById.rejected, (state, action) => {
        state.vendorsLoading = false;
        state.vendorsError = action.payload || "Failed to fetch vendor";
        state.currentVendor = null;
      })
      
      // Create vendor
      .addCase(createVendor.pending, (state) => {
        state.vendorsLoading = true;
        state.vendorsError = null;
      })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.vendorsLoading = false;
        state.vendors.unshift(action.payload);
      })
      .addCase(createVendor.rejected, (state, action) => {
        state.vendorsLoading = false;
        state.vendorsError = action.payload || "Failed to create vendor";
      })
      
      // Update vendor
      .addCase(editVendor.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.vendors.findIndex(vendor => vendor._id === updated._id);
        if (idx !== -1) {
          state.vendors[idx] = updated;
        }
        if (state.currentVendor && state.currentVendor._id === updated._id) {
          state.currentVendor = updated;
        }
      })
      
      // Delete vendor
      .addCase(removeVendor.fulfilled, (state, action) => {
        const id = action.payload;
        state.vendors = state.vendors.filter(vendor => vendor._id !== id);
        if (state.currentVendor && state.currentVendor._id === id) {
          state.currentVendor = null;
        }
      })
      
      // ==================== ANALYTICS ====================
      
      // Fetch dashboard
      .addCase(fetchSpendingDashboard.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(fetchSpendingDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchSpendingDashboard.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = action.payload || "Failed to fetch dashboard data";
      })
      
      // Fetch analytics
      .addCase(fetchSpendingAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchSpendingAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsData = action.payload;
      })
      .addCase(fetchSpendingAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload || "Failed to fetch analytics data";
      });
  }
});

// Export actions
export const {
  clearError,
  clearCategoriesError,
  clearVendorsError,
  clearDashboardError,
  clearAnalyticsError,
  setFilters,
  clearFilters,
  clearCurrentSpending,
  clearCurrentCategory,
  clearCurrentVendor,
  setPagination
} = spendingSlice.actions;

// Export reducer
export default spendingSlice.reducer;
