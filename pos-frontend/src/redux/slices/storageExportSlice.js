import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getStorageExports,
    getStorageExportById,
    createStorageExport,
    updateStorageExport,
    cancelStorageExport
} from "../../https";

// Fetch all exports
export const fetchStorageExports = createAsyncThunk("storageExports/fetchAll", async (params = {}, thunkAPI) => {
    try {
        const { data } = await getStorageExports(params);
        return {
            items: data.data || [],
            pagination: data.pagination || {}
        };
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch exports");
    }
});

// Fetch export by ID
export const fetchStorageExportById = createAsyncThunk("storageExports/fetchById", async (id, thunkAPI) => {
    try {
        const { data } = await getStorageExportById(id);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch export");
    }
});

// Create export
export const createStorageExportAction = createAsyncThunk("storageExports/create", async (exportData, thunkAPI) => {
    try {
        const { data } = await createStorageExport(exportData);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create export");
    }
});

// Update export
export const editStorageExport = createAsyncThunk("storageExports/update", async ({ id, ...updates }, thunkAPI) => {
    try {
        const { data } = await updateStorageExport({ id, ...updates });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update export");
    }
});

// Cancel export
export const cancelStorageExportAction = createAsyncThunk("storageExports/cancel", async (id, thunkAPI) => {
    try {
        const { data } = await cancelStorageExport(id);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to cancel export");
    }
});

const initialState = {
    items: [],
    selectedExport: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
    }
};

const storageExportSlice = createSlice({
    name: "storageExports",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSelectedExport: (state) => {
            state.selectedExport = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all exports
            .addCase(fetchStorageExports.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStorageExports.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items || [];
                state.pagination = action.payload.pagination || state.pagination;
            })
            .addCase(fetchStorageExports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch exports");
            })
            // Fetch export by ID
            .addCase(fetchStorageExportById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStorageExportById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedExport = action.payload;
            })
            .addCase(fetchStorageExportById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch export");
            })
            // Create export
            .addCase(createStorageExportAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createStorageExportAction.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
            })
            .addCase(createStorageExportAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to create export");
            })
            // Update export
            .addCase(editStorageExport.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.items.findIndex(item => item._id === updated._id);
                if (idx !== -1) {
                    state.items[idx] = updated;
                }
                if (state.selectedExport && state.selectedExport._id === updated._id) {
                    state.selectedExport = updated;
                }
            })
            // Cancel export
            .addCase(cancelStorageExportAction.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.items.findIndex(item => item._id === updated._id);
                if (idx !== -1) {
                    state.items[idx] = updated;
                }
                if (state.selectedExport && state.selectedExport._id === updated._id) {
                    state.selectedExport = updated;
                }
            });
    }
});

export const { clearError, clearSelectedExport } = storageExportSlice.actions;
export default storageExportSlice.reducer;
