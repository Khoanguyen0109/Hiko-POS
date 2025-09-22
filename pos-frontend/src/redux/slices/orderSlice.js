import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getOrders, getOrderById, addOrder, updateOrderStatus } from "../../https";

// Order async thunks
export const fetchOrders = createAsyncThunk("orders/fetchAll", async (params = {}, thunkAPI) => {
    try {
        const { data } = await getOrders(params);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
    }
});

export const fetchOrderById = createAsyncThunk("orders/fetchById", async (orderId, thunkAPI) => {
    try {
        const { data } = await getOrderById(orderId);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch order");
    }
});

export const createOrder = createAsyncThunk("orders/create", async (orderData, thunkAPI) => {
    try {
        const { data } = await addOrder(orderData);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create order");
    }
});

export const updateOrder = createAsyncThunk("orders/updateStatus", async ({ orderId, orderStatus }, thunkAPI) => {
    try {
        const { data } = await updateOrderStatus({ orderId, orderStatus });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update order status");
    }
});

const initialState = {
    items: [],
    currentOrder: null,
    recentOrders: [],
    loading: false,
    error: null,
    filters: {
        startDate: null,
        endDate: null,
        status: 'all',
        createdBy: 'all',
        paymentMethod: 'all',
        thirdPartyVendor: 'all'
    }
};

const orderSlice = createSlice({
    name: "orders",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all orders
            .addCase(fetchOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload || [];
                // Update recent orders (last 5)
                state.recentOrders = (action.payload || []).slice(0, 5);
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch orders";
            })

            // Fetch order by ID
            .addCase(fetchOrderById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload;
            })
            .addCase(fetchOrderById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch order";
                state.currentOrder = null;
            })

            // Create order
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
                // Update recent orders
                state.recentOrders.unshift(action.payload);
                if (state.recentOrders.length > 5) {
                    state.recentOrders.pop();
                }
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to create order";
            })

            // Update order status
            .addCase(updateOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateOrder.fulfilled, (state, action) => {
                state.loading = false;
                const updated = action.payload;
                
                // Update in items array
                const itemIndex = state.items.findIndex(order => order._id === updated._id);
                if (itemIndex !== -1) {
                    state.items[itemIndex] = updated;
                }
                
                // Update current order if it matches
                if (state.currentOrder && state.currentOrder._id === updated._id) {
                    state.currentOrder = updated;
                }
                
                // Update in recent orders
                const recentIndex = state.recentOrders.findIndex(order => order._id === updated._id);
                if (recentIndex !== -1) {
                    state.recentOrders[recentIndex] = updated;
                }
            })
            .addCase(updateOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to update order status";
            });
    }
});

export const { clearError, setFilters, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
