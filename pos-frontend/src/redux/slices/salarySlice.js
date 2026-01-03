import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllMembersSalarySummary } from "../../https";

// Async thunk for fetching salary summary for all members
export const fetchSalarySummary = createAsyncThunk(
    "salary/fetchSalarySummary",
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await getAllMembersSalarySummary(params);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch salary summary");
        }
    }
);

const initialState = {
    summaryData: null,
    loading: false,
    error: null
};

const salarySlice = createSlice({
    name: "salary",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSummaryData: (state) => {
            state.summaryData = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSalarySummary.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSalarySummary.fulfilled, (state, action) => {
                state.loading = false;
                state.summaryData = action.payload;
            })
            .addCase(fetchSalarySummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch salary summary";
            });
    }
});

export const { clearError, clearSummaryData } = salarySlice.actions;

export default salarySlice.reducer;

