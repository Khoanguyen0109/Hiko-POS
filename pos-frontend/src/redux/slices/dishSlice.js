import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
    getDishes, 
    addDish, 
    updateDish, 
    deleteDish, 
    getDishesByCategory, 
    getAvailableDishes, 
    toggleDishAvailability 
} from "../../https";

export const fetchDishes = createAsyncThunk("dishes/fetchAll", async (_, thunkAPI) => {
    try{
        const { data } = await getDishes();
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch dishes");
    }
});

export const fetchAvailableDishes = createAsyncThunk("dishes/fetchAvailable", async (_, thunkAPI) => {
    try{
        const { data } = await getAvailableDishes();
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch available dishes");
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

export const toggleAvailability = createAsyncThunk("dishes/toggleAvailability", async (dishId, thunkAPI) => {
    try{
        const { data } = await toggleDishAvailability(dishId);
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to toggle dish availability");
    }
});

const initialState = {
    items: [],
    availableItems: [],
    loading: false,
    error: null
};

const dishSlice = createSlice({
    name: "dishes",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all dishes
            .addCase(fetchDishes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDishes.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload || [];
            })
            .addCase(fetchDishes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch dishes");
            })
            
            // Fetch available dishes
            .addCase(fetchAvailableDishes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAvailableDishes.fulfilled, (state, action) => {
                state.loading = false;
                state.availableItems = action.payload || [];
            })
            .addCase(fetchAvailableDishes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch available dishes");
            })
            
            // Create dish
            .addCase(createDish.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createDish.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
                // Add to available items if the dish is available
                if (action.payload.isAvailable) {
                    state.availableItems.unshift(action.payload);
                }
            })
            .addCase(createDish.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to create dish");
            })
            
            // Update dish
            .addCase(editDish.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.items.findIndex(d => d._id === updated._id);
                if(idx !== -1){
                    state.items[idx] = updated;
                }
                
                // Update available items
                const availableIdx = state.availableItems.findIndex(d => d._id === updated._id);
                if (updated.isAvailable) {
                    if (availableIdx === -1) {
                        state.availableItems.push(updated);
                    } else {
                        state.availableItems[availableIdx] = updated;
                    }
                } else {
                    if (availableIdx !== -1) {
                        state.availableItems.splice(availableIdx, 1);
                    }
                }
            })
            
            // Delete dish
            .addCase(removeDish.fulfilled, (state, action) => {
                const id = action.payload;
                state.items = state.items.filter(d => d._id !== id);
                state.availableItems = state.availableItems.filter(d => d._id !== id);
            })
            
            // Toggle availability
            .addCase(toggleAvailability.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(toggleAvailability.fulfilled, (state, action) => {
                state.loading = false;
                const updated = action.payload;
                
                // Update main items
                const idx = state.items.findIndex(d => d._id === updated._id);
                if(idx !== -1){
                    state.items[idx] = updated;
                }
                
                // Update available items
                const availableIdx = state.availableItems.findIndex(d => d._id === updated._id);
                if (updated.isAvailable) {
                    if (availableIdx === -1) {
                        state.availableItems.push(updated);
                    } else {
                        state.availableItems[availableIdx] = updated;
                    }
                } else {
                    if (availableIdx !== -1) {
                        state.availableItems.splice(availableIdx, 1);
                    }
                }
            })
            .addCase(toggleAvailability.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to toggle availability");
            });
    }
});

export const { clearError } = dishSlice.actions;
export default dishSlice.reducer; 