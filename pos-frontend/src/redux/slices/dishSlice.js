import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDishes, addDish, updateDish, deleteDish, getDishesByCategory } from "../../https";

export const fetchDishes = createAsyncThunk("dishes/fetchAll", async (_, thunkAPI) => {
    try{
        const { data } = await getDishes();
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch dishes");
    }
});

export const fetchDishesByCategory = createAsyncThunk("dishes/fetchByCategory", async (categoryId, thunkAPI) => {
    try{
        const { data } = await getDishesByCategory(categoryId);
        return { categoryId, items: data.data };
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch dishes by category");
    }
});

export const createDish = createAsyncThunk("dishes/create", async (payload, thunkAPI) => {
    try{
        const { data } = await addDish(payload);
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create dish");
    }
});

export const editDish = createAsyncThunk("dishes/update", async ({ dishId, ...updates }, thunkAPI) => {
    try{
        const { data } = await updateDish({ dishId, ...updates });
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update dish");
    }
});

export const removeDish = createAsyncThunk("dishes/delete", async (dishId, thunkAPI) => {
    try{
        await deleteDish(dishId);
        return dishId;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete dish");
    }
});

const initialState = {
    items: [],
    loading: false,
    error: null,
    lastFetchedCategory: null
};

const dishSlice = createSlice({
    name: "dishes",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDishes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDishes.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload || [];
                state.lastFetchedCategory = null;
            })
            .addCase(fetchDishes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch dishes");
            })
            .addCase(fetchDishesByCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDishesByCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items || [];
                state.lastFetchedCategory = action.payload.categoryId;
            })
            .addCase(fetchDishesByCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch dishes by category");
            })
            .addCase(createDish.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            .addCase(editDish.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.items.findIndex(d => d._id === updated._id);
                if(idx !== -1){
                    state.items[idx] = updated;
                }
            })
            .addCase(removeDish.fulfilled, (state, action) => {
                const id = action.payload;
                state.items = state.items.filter(d => d._id !== id);
            });
    }
});

export default dishSlice.reducer; 