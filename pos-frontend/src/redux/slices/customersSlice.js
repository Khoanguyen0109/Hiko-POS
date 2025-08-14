import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from "../../https";

export const fetchCustomers = createAsyncThunk("customers/fetchAll", async (_, thunkAPI) => {
    try{
        const { data } = await getCustomers();
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch customers");
    }
});

export const createCustomer = createAsyncThunk("customers/create", async (payload, thunkAPI) => {
    try{
        const { data } = await addCustomer(payload);
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create customer");
    }
});

export const editCustomer = createAsyncThunk("customers/update", async ({ customerId, ...updates }, thunkAPI) => {
    try{
        const { data } = await updateCustomer({ customerId, ...updates });
        return data.data;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update customer");
    }
});

export const removeCustomerData = createAsyncThunk("customers/delete", async (customerId, thunkAPI) => {
    try{
        await deleteCustomer(customerId);
        return customerId;
    }catch(error){
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete customer");
    }
});

const initialState = {
    items: [],
    loading: false,
    error: null
};

const customersSlice = createSlice({
    name: "customersData",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCustomers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCustomers.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload || [];
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || String(action.error.message || "Failed to fetch customers");
            })
            .addCase(createCustomer.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            .addCase(editCustomer.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.items.findIndex(c => c._id === updated._id);
                if(idx !== -1){
                    state.items[idx] = updated;
                }
            })
            .addCase(removeCustomerData.fulfilled, (state, action) => {
                const id = action.payload;
                state.items = state.items.filter(c => c._id !== id);
            });
    }
});

export default customersSlice.reducer; 