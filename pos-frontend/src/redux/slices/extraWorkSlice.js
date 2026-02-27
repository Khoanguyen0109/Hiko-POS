import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as extraWorkApi from "../../https/extraWorkApi";

// Async thunks
export const fetchExtraWork = createAsyncThunk(
    "extraWork/fetchAll",
    async (filters, { rejectWithValue }) => {
        try {
            const response = await extraWorkApi.getAllExtraWork(filters);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch extra work");
        }
    }
);

export const createExtraWork = createAsyncThunk(
    "extraWork/create",
    async (data, { rejectWithValue }) => {
        try {
            const response = await extraWorkApi.createExtraWork(data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create extra work");
        }
    }
);

export const updateExtraWork = createAsyncThunk(
    "extraWork/update",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await extraWorkApi.updateExtraWork(id, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update extra work");
        }
    }
);

export const deleteExtraWork = createAsyncThunk(
    "extraWork/delete",
    async (id, { rejectWithValue }) => {
        try {
            await extraWorkApi.deleteExtraWork(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete extra work");
        }
    }
);

export const approveExtraWork = createAsyncThunk(
    "extraWork/approve",
    async (id, { rejectWithValue }) => {
        try {
            const response = await extraWorkApi.approveExtraWork(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to approve extra work");
        }
    }
);

const initialState = {
    extraWorkEntries: [],
    totalHours: 0,
    totalPayment: 0,
    loading: false,
    error: null,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false
};

const extraWorkSlice = createSlice({
    name: "extraWork",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Fetch extra work
        builder
            .addCase(fetchExtraWork.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchExtraWork.fulfilled, (state, action) => {
                state.loading = false;
                state.extraWorkEntries = action.payload.data;
                state.totalHours = action.payload.totalHours || 0;
                state.totalPayment = action.payload.totalPayment || 0;
                state.error = null;
            })
            .addCase(fetchExtraWork.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
            
        // Create extra work
        builder
            .addCase(createExtraWork.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createExtraWork.fulfilled, (state, action) => {
                state.createLoading = false;
                const entry = action.payload.data;
                state.extraWorkEntries.unshift(entry);
                state.totalHours += entry.durationHours || 0;
                state.totalPayment += entry.paymentAmount || 0;
                state.error = null;
            })
            .addCase(createExtraWork.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
            });
            
        // Delete extra work
        builder
            .addCase(deleteExtraWork.fulfilled, (state, action) => {
                const removed = state.extraWorkEntries.find(
                    entry => entry._id === action.payload
                );
                if (removed) {
                    state.totalHours -= removed.durationHours || 0;
                    state.totalPayment -= removed.paymentAmount || 0;
                }
                state.extraWorkEntries = state.extraWorkEntries.filter(
                    entry => entry._id !== action.payload
                );
            });
    }
});

export const { clearError } = extraWorkSlice.actions;
export default extraWorkSlice.reducer;

