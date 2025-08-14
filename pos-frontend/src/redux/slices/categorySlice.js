import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCategories, addCategory, updateCategory, deleteCategory } from "../../https";

export const fetchCategories = createAsyncThunk("categories/fetchAll", async (_, thunkAPI) => {
    try{
        const { data } = await getCategories();
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch categories");
    }
});

export const createCategory = createAsyncThunk("categories/create", async (payload, thunkAPI) => {
    try{
        const { data } = await addCategory(payload);
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create category");
    }
});

export const editCategory = createAsyncThunk("categories/update", async ({ categoryId, ...updates }, thunkAPI) => {
    try{
        const { data } = await updateCategory({ categoryId, ...updates });
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update category");
    }
});

export const removeCategory = createAsyncThunk("categories/delete", async (categoryId, thunkAPI) => {
    try{
        await deleteCategory(categoryId);
        return categoryId;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete category");
    }
});

const initialState = {
    items: [],
    loading: false,
    error: null
};

const categorySlice = createSlice({
    name: "categories",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload || [];
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch categories");
            })
            .addCase(createCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
            })
            .addCase(createCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to create category");
            })
            .addCase(editCategory.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.items.findIndex(c => c._id === updated._id);
                if(idx !== -1){
                    state.items[idx] = updated;
                }
            })
            .addCase(removeCategory.fulfilled, (state, action) => {
                const id = action.payload;
                state.items = state.items.filter(c => c._id !== id);
            });
    }
});

export default categorySlice.reducer; 