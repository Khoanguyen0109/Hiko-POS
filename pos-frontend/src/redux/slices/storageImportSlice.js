import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getStorageImports,
    getStorageImportById,
    createStorageImport,
    updateStorageImport,
    cancelStorageImport
} from "../../https";

// Fetch all imports
export const fetchStorageImports = createAsyncThunk("storageImports/fetchAll", async (params = {}, thunkAPI) => {
    try {
        const { data } = await getStorageImports(params);
        return {
            items: data.data || [],
            pagination: data.pagination || {}
        };
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch imports");
    }
});

// Fetch import by ID
export const fetchStorageImportById = createAsyncThunk("storageImports/fetchById", async (id, thunkAPI) => {
    try {
        const { data } = await getStorageImportById(id);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch import");
    }
});

// Create import
export const createStorageImportAction = createAsyncThunk("storageImports/create", async (importData, thunkAPI) => {
    try {
        const { data } = await createStorageImport(importData);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create import");
    }
});

// Update import
export const editStorageImport = createAsyncThunk("storageImports/update", async ({ id, ...updates }, thunkAPI) => {
    try {
        const { data } = await updateStorageImport({ id, ...updates });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update import");
    }
});

// Cancel import
export const cancelStorageImportAction = createAsyncThunk("storageImports/cancel", async (id, thunkAPI) => {
    try {
        const { data } = await cancelStorageImport(id);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to cancel import");
    }
});

const initialState = {
    items: [],
    selectedImport: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
    }
};

const storageImportSlice = createSlice({
    name: "storageImports",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSelectedImport: (state) => {
            state.selectedImport = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all imports
            .addCase(fetchStorageImports.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStorageImports.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items || [];
                state.pagination = action.payload.pagination || state.pagination;
            })
            .addCase(fetchStorageImports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch imports");
            })
            // Fetch import by ID
            .addCase(fetchStorageImportById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStorageImportById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedImport = action.payload;
            })
            .addCase(fetchStorageImportById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch import");
            })
            // Create import
            .addCase(createStorageImportAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createStorageImportAction.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
            })
            .addCase(createStorageImportAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to create import");
            })
            // Update import
            .addCase(editStorageImport.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.items.findIndex(item => item._id === updated._id);
                if (idx !== -1) {
                    state.items[idx] = updated;
                }
                if (state.selectedImport && state.selectedImport._id === updated._id) {
                    state.selectedImport = updated;
                }
            })
            // Cancel import
            .addCase(cancelStorageImportAction.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.items.findIndex(item => item._id === updated._id);
                if (idx !== -1) {
                    state.items[idx] = updated;
                }
                if (state.selectedImport && state.selectedImport._id === updated._id) {
                    state.selectedImport = updated;
                }
            });
    }
});

export const { clearError, clearSelectedImport } = storageImportSlice.actions;
export default storageImportSlice.reducer;
