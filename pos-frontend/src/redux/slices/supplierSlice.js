import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getSuppliers,
    getActiveSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
} from "../../https";

// Fetch all suppliers
export const fetchSuppliers = createAsyncThunk("suppliers/fetchAll", async (params = {}, thunkAPI) => {
    try {
        const { data } = await getSuppliers(params);
        return {
            items: data.data || [],
            pagination: data.pagination || {}
        };
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch suppliers");
    }
});

// Fetch active suppliers (for dropdowns)
export const fetchActiveSuppliers = createAsyncThunk("suppliers/fetchActive", async (_, thunkAPI) => {
    try {
        const { data } = await getActiveSuppliers();
        return data.data || [];
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch active suppliers");
    }
});

// Fetch supplier by ID
export const fetchSupplierById = createAsyncThunk("suppliers/fetchById", async (id, thunkAPI) => {
    try {
        const { data } = await getSupplierById(id);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch supplier");
    }
});

// Create supplier
export const createSupplierAction = createAsyncThunk("suppliers/create", async (supplierData, thunkAPI) => {
    try {
        const { data } = await createSupplier(supplierData);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create supplier");
    }
});

// Update supplier
export const editSupplier = createAsyncThunk("suppliers/update", async ({ id, ...updates }, thunkAPI) => {
    try {
        const { data } = await updateSupplier({ id, ...updates });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update supplier");
    }
});

// Delete supplier
export const removeSupplier = createAsyncThunk("suppliers/delete", async (id, thunkAPI) => {
    try {
        await deleteSupplier(id);
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete supplier");
    }
});

const initialState = {
    items: [],
    activeSuppliers: [],
    selectedSupplier: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
    }
};

const supplierSlice = createSlice({
    name: "suppliers",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSelectedSupplier: (state) => {
            state.selectedSupplier = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all suppliers
            .addCase(fetchSuppliers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSuppliers.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items || [];
                state.pagination = action.payload.pagination || state.pagination;
            })
            .addCase(fetchSuppliers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch suppliers");
            })
            // Fetch active suppliers
            .addCase(fetchActiveSuppliers.pending, (state) => {
                // Don't set loading to true to avoid UI flicker
            })
            .addCase(fetchActiveSuppliers.fulfilled, (state, action) => {
                state.activeSuppliers = action.payload || [];
            })
            .addCase(fetchActiveSuppliers.rejected, (state, action) => {
                state.error = action.payload || String(action.error.message || "Failed to fetch active suppliers");
            })
            // Fetch supplier by ID
            .addCase(fetchSupplierById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSupplierById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedSupplier = action.payload;
            })
            .addCase(fetchSupplierById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch supplier");
            })
            // Create supplier
            .addCase(createSupplierAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSupplierAction.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
                // Add to active suppliers if active
                if (action.payload.isActive) {
                    state.activeSuppliers.push(action.payload);
                }
            })
            .addCase(createSupplierAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to create supplier");
            })
            // Update supplier
            .addCase(editSupplier.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.items.findIndex(s => s._id === updated._id);
                if (idx !== -1) {
                    state.items[idx] = updated;
                }
                // Update active suppliers
                const activeIdx = state.activeSuppliers.findIndex(s => s._id === updated._id);
                if (updated.isActive) {
                    if (activeIdx === -1) {
                        state.activeSuppliers.push(updated);
                    } else {
                        state.activeSuppliers[activeIdx] = updated;
                    }
                } else {
                    state.activeSuppliers = state.activeSuppliers.filter(s => s._id !== updated._id);
                }
                // Update selected supplier if it's the one being updated
                if (state.selectedSupplier && state.selectedSupplier._id === updated._id) {
                    state.selectedSupplier = updated;
                }
            })
            // Delete supplier
            .addCase(removeSupplier.fulfilled, (state, action) => {
                const id = action.payload;
                state.items = state.items.filter(s => s._id !== id);
                state.activeSuppliers = state.activeSuppliers.filter(s => s._id !== id);
                if (state.selectedSupplier && state.selectedSupplier._id === id) {
                    state.selectedSupplier = null;
                }
            });
    }
});

export const { clearError, clearSelectedSupplier } = supplierSlice.actions;
export default supplierSlice.reducer;
