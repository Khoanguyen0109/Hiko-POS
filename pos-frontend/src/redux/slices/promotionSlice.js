import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
    getPromotions, 
    getPromotionById,
    addPromotion, 
    updatePromotion, 
    deletePromotion, 
    togglePromotionStatus,
    getPromotionAnalytics,
    validateCouponCode
} from "../../https";

// Async thunks for promotion management
export const fetchPromotions = createAsyncThunk(
    "promotions/fetchPromotions",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await getPromotions(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch promotions");
        }
    }
);

export const fetchPromotionById = createAsyncThunk(
    "promotions/fetchPromotionById",
    async (promotionId, { rejectWithValue }) => {
        try {
            const response = await getPromotionById(promotionId);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch promotion");
        }
    }
);

export const createPromotion = createAsyncThunk(
    "promotions/createPromotion",
    async (promotionData, { rejectWithValue }) => {
        try {
            const response = await addPromotion(promotionData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create promotion");
        }
    }
);

export const editPromotion = createAsyncThunk(
    "promotions/editPromotion",
    async ({ promotionId, ...updates }, { rejectWithValue }) => {
        try {
            const response = await updatePromotion({ promotionId, ...updates });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update promotion");
        }
    }
);

export const removePromotion = createAsyncThunk(
    "promotions/removePromotion",
    async (promotionId, { rejectWithValue }) => {
        try {
            await deletePromotion(promotionId);
            return promotionId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete promotion");
        }
    }
);

export const toggleStatus = createAsyncThunk(
    "promotions/toggleStatus",
    async (promotionId, { rejectWithValue }) => {
        try {
            const response = await togglePromotionStatus(promotionId);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to toggle promotion status");
        }
    }
);

export const fetchAnalytics = createAsyncThunk(
    "promotions/fetchAnalytics",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await getPromotionAnalytics(params);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch promotion analytics");
        }
    }
);

export const validateCoupon = createAsyncThunk(
    "promotions/validateCoupon",
    async (code, { rejectWithValue }) => {
        try {
            const response = await validateCouponCode(code);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Invalid coupon code");
        }
    }
);

const initialState = {
    // Main promotion data
    items: [],
    totalPages: 1,
    currentPage: 1,
    totalItems: 0,
    
    // Single promotion (for editing)
    selectedPromotion: null,
    
    // Analytics data
    analytics: null,
    
    // Coupon validation
    validatedCoupon: null,
    
    // Loading states
    loading: false,
    analyticsLoading: false,
    couponValidating: false,
    
    // Error states
    error: null,
    analyticsError: null,
    couponError: null,
    
    // Filters
    filters: {
        search: '',
        isActive: '',
        type: '',
        page: 1,
        limit: 10
    }
};

const promotionSlice = createSlice({
    name: "promotions",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearAnalyticsError: (state) => {
            state.analyticsError = null;
        },
        clearCouponError: (state) => {
            state.couponError = null;
        },
        clearValidatedCoupon: (state) => {
            state.validatedCoupon = null;
            state.couponError = null;
        },
        clearSelectedPromotion: (state) => {
            state.selectedPromotion = null;
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        resetFilters: (state) => {
            state.filters = initialState.filters;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch promotions
            .addCase(fetchPromotions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPromotions.fulfilled, (state, action) => {
                state.loading = false;
                const { promotions, pagination } = action.payload.data || {};
                state.items = promotions || [];
                state.totalPages = pagination?.totalPages || 1;
                state.currentPage = pagination?.currentPage || 1;
                state.totalItems = pagination?.totalItems || 0;
            })
            .addCase(fetchPromotions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch promotions";
            })
            
            // Fetch single promotion
            .addCase(fetchPromotionById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPromotionById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedPromotion = action.payload;
            })
            .addCase(fetchPromotionById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch promotion";
            })
            
            // Create promotion
            .addCase(createPromotion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPromotion.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
                state.totalItems += 1;
            })
            .addCase(createPromotion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to create promotion";
            })
            
            // Edit promotion
            .addCase(editPromotion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(editPromotion.fulfilled, (state, action) => {
                state.loading = false;
                const updated = action.payload;
                const idx = state.items.findIndex(p => p._id === updated._id);
                if (idx !== -1) {
                    state.items[idx] = updated;
                }
                if (state.selectedPromotion?._id === updated._id) {
                    state.selectedPromotion = updated;
                }
            })
            .addCase(editPromotion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to update promotion";
            })
            
            // Delete promotion
            .addCase(removePromotion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removePromotion.fulfilled, (state, action) => {
                state.loading = false;
                const id = action.payload;
                state.items = state.items.filter(p => p._id !== id);
                state.totalItems = Math.max(0, state.totalItems - 1);
                if (state.selectedPromotion?._id === id) {
                    state.selectedPromotion = null;
                }
            })
            .addCase(removePromotion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to delete promotion";
            })
            
            // Toggle status
            .addCase(toggleStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(toggleStatus.fulfilled, (state, action) => {
                state.loading = false;
                const updated = action.payload;
                const idx = state.items.findIndex(p => p._id === updated._id);
                if (idx !== -1) {
                    state.items[idx] = updated;
                }
                if (state.selectedPromotion?._id === updated._id) {
                    state.selectedPromotion = updated;
                }
            })
            .addCase(toggleStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to toggle promotion status";
            })
            
            // Fetch analytics
            .addCase(fetchAnalytics.pending, (state) => {
                state.analyticsLoading = true;
                state.analyticsError = null;
            })
            .addCase(fetchAnalytics.fulfilled, (state, action) => {
                state.analyticsLoading = false;
                state.analytics = action.payload;
            })
            .addCase(fetchAnalytics.rejected, (state, action) => {
                state.analyticsLoading = false;
                state.analyticsError = action.payload || "Failed to fetch analytics";
            })
            
            // Validate coupon
            .addCase(validateCoupon.pending, (state) => {
                state.couponValidating = true;
                state.couponError = null;
            })
            .addCase(validateCoupon.fulfilled, (state, action) => {
                state.couponValidating = false;
                state.validatedCoupon = action.payload;
            })
            .addCase(validateCoupon.rejected, (state, action) => {
                state.couponValidating = false;
                state.couponError = action.payload || "Invalid coupon code";
                state.validatedCoupon = null;
            });
    }
});

export const { 
    clearError, 
    clearAnalyticsError, 
    clearCouponError, 
    clearValidatedCoupon, 
    clearSelectedPromotion,
    setFilters,
    resetFilters
} = promotionSlice.actions;

export default promotionSlice.reducer;
