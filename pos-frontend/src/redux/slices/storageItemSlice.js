import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getStorageItems,
    getStorageItemById,
    createStorageItem,
    updateStorageItem,
    deleteStorageItem,
    getLowStockItems
} from "../../https";

// Fetch all storage items
export const fetchStorageItems = createAsyncThunk("storageItems/fetchAll", async (params = {}, thunkAPI) => {
    try {
        const { data } = await getStorageItems(params);
        return {
            items: data.data || [],
            pagination: data.pagination || {}
        };
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch storage items");
    }
});

// Fetch storage item by ID
export const fetchStorageItemById = createAsyncThunk("storageItems/fetchById", async (id, thunkAPI) => {
    try {
        const { data } = await getStorageItemById(id);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch storage item");
    }
});

// Create storage item
export const createStorageItemAction = createAsyncThunk("storageItems/create", async (itemData, thunkAPI) => {
    try {
        const { data } = await createStorageItem(itemData);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create storage item");
    }
});

// Update storage item
export const editStorageItem = createAsyncThunk("storageItems/update", async ({ id, ...updates }, thunkAPI) => {
    try {
        const { data } = await updateStorageItem({ id, ...updates });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update storage item");
    }
});

// Delete storage item
export const removeStorageItem = createAsyncThunk("storageItems/delete", async (id, thunkAPI) => {
    try {
        await deleteStorageItem(id);
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete storage item");
    }
});

// Fetch low stock items
export const fetchLowStockItems = createAsyncThunk("storageItems/fetchLowStock", async (_, thunkAPI) => {
    try {
        const { data } = await getLowStockItems();
        return data.data || [];
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch low stock items");
    }
});

const initialState = {
    items: [],
    lowStockItems: [],
    selectedItem: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
    }
};

const storageItemSlice = createSlice({
    name: "storageItems",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSelectedItem: (state) => {
            state.selectedItem = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all storage items
            .addCase(fetchStorageItems.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStorageItems.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items || [];
                state.pagination = action.payload.pagination || state.pagination;
            })
            .addCase(fetchStorageItems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch storage items");
            })
            // Fetch storage item by ID
            .addCase(fetchStorageItemById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStorageItemById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedItem = action.payload;
            })
            .addCase(fetchStorageItemById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch storage item");
            })
            // Create storage item
            .addCase(createStorageItemAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createStorageItemAction.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
            })
            .addCase(createStorageItemAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to create storage item");
            })
            // Update storage item
            .addCase(editStorageItem.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.items.findIndex(item => item._id === updated._id);
                if (idx !== -1) {
                    state.items[idx] = updated;
                }
                // Update selected item if it's the one being updated
                if (state.selectedItem && state.selectedItem._id === updated._id) {
                    state.selectedItem = updated;
                }
            })
            // Delete storage item
            .addCase(removeStorageItem.fulfilled, (state, action) => {
                const id = action.payload;
                state.items = state.items.filter(item => item._id !== id);
                if (state.selectedItem && state.selectedItem._id === id) {
                    state.selectedItem = null;
                }
            })
            // Fetch low stock items
            .addCase(fetchLowStockItems.fulfilled, (state, action) => {
                state.lowStockItems = action.payload || [];
            });
    }
});

export const { clearError, clearSelectedItem } = storageItemSlice.actions;
export default storageItemSlice.reducer;
