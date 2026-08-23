import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getStorageVariance } from "../../https";

export const fetchStorageVariance = createAsyncThunk(
    "storageVariance/fetch",
    async (params = {}, thunkAPI) => {
        try {
            const { data } = await getStorageVariance(params);
            return data.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || "Failed to fetch material variance"
            );
        }
    }
);

const storageVarianceSlice = createSlice({
    name: "storageVariance",
    initialState: {
        summary: null,
        items: [],
        storeSummaries: [],
        coverage: { missingRecipes: [], unitMismatches: [] },
        scope: "single",
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStorageVariance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStorageVariance.fulfilled, (state, action) => {
                state.loading = false;
                state.summary = action.payload.summary;
                state.items = action.payload.items;
                state.storeSummaries = action.payload.storeSummaries || [];
                state.coverage = action.payload.coverage || {
                    missingRecipes: [],
                    unitMismatches: [],
                };
                state.scope = action.payload.scope || "single";
                state.error = null;
            })
            .addCase(fetchStorageVariance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError } = storageVarianceSlice.actions;
export default storageVarianceSlice.reducer;
