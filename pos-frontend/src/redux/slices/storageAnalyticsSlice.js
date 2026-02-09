import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getStorageAnalytics } from "../../https";

// Fetch storage analytics
export const fetchStorageAnalytics = createAsyncThunk(
    "storageAnalytics/fetch",
    async (params = {}, thunkAPI) => {
        try {
            const { data } = await getStorageAnalytics(params);
            return data.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || "Failed to fetch storage analytics"
            );
        }
    }
);

const storageAnalyticsSlice = createSlice({
    name: "storageAnalytics",
    initialState: {
        summary: null,
        items: [],
        loading: false,
        error: null
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStorageAnalytics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStorageAnalytics.fulfilled, (state, action) => {
                state.loading = false;
                state.summary = action.payload.summary;
                state.items = action.payload.items;
                state.error = null;
            })
            .addCase(fetchStorageAnalytics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError } = storageAnalyticsSlice.actions;
export default storageAnalyticsSlice.reducer;
