import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getRewardPrograms,
    addRewardProgram,
    updateRewardProgram,
    deleteRewardProgram,
    toggleRewardProgramStatus,
    getCustomerRewards,
    getRewardAnalytics
} from "../../https";

export const fetchRewardPrograms = createAsyncThunk("rewards/fetchPrograms", async (params = {}, thunkAPI) => {
    try {
        const { data } = await getRewardPrograms(params);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch reward programs");
    }
});

export const createRewardProgram = createAsyncThunk("rewards/createProgram", async (payload, thunkAPI) => {
    try {
        const { data } = await addRewardProgram(payload);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create reward program");
    }
});

export const editRewardProgram = createAsyncThunk("rewards/updateProgram", async ({ id, ...updates }, thunkAPI) => {
    try {
        const { data } = await updateRewardProgram({ id, ...updates });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update reward program");
    }
});

export const removeRewardProgram = createAsyncThunk("rewards/deleteProgram", async (id, thunkAPI) => {
    try {
        await deleteRewardProgram(id);
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete reward program");
    }
});

export const toggleProgramStatus = createAsyncThunk("rewards/toggleStatus", async (id, thunkAPI) => {
    try {
        const { data } = await toggleRewardProgramStatus(id);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to toggle program status");
    }
});

export const fetchCustomerRewards = createAsyncThunk("rewards/fetchCustomerRewards", async (customerId, thunkAPI) => {
    try {
        const { data } = await getCustomerRewards(customerId);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch customer rewards");
    }
});

export const fetchRewardAnalytics = createAsyncThunk("rewards/fetchAnalytics", async (params = {}, thunkAPI) => {
    try {
        const { data } = await getRewardAnalytics(params);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch analytics");
    }
});

const initialState = {
    programs: [],
    programsLoading: false,
    programsError: null,
    customerRewards: null,
    rewardsLoading: false,
    appliedReward: null,
    analytics: null,
    analyticsLoading: false
};

const rewardSlice = createSlice({
    name: "rewards",
    initialState,
    reducers: {
        applyReward: (state, action) => {
            state.appliedReward = action.payload;
        },
        removeAppliedReward: (state) => {
            state.appliedReward = null;
        },
        clearCustomerRewards: (state) => {
            state.customerRewards = null;
            state.appliedReward = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRewardPrograms.pending, (state) => { state.programsLoading = true; state.programsError = null; })
            .addCase(fetchRewardPrograms.fulfilled, (state, action) => { state.programsLoading = false; state.programs = action.payload || []; })
            .addCase(fetchRewardPrograms.rejected, (state, action) => { state.programsLoading = false; state.programsError = action.payload; })
            .addCase(createRewardProgram.fulfilled, (state, action) => { state.programs.unshift(action.payload); })
            .addCase(editRewardProgram.fulfilled, (state, action) => {
                const idx = state.programs.findIndex(p => p._id === action.payload._id);
                if (idx !== -1) state.programs[idx] = action.payload;
            })
            .addCase(removeRewardProgram.fulfilled, (state, action) => {
                state.programs = state.programs.filter(p => p._id !== action.payload);
            })
            .addCase(toggleProgramStatus.fulfilled, (state, action) => {
                const idx = state.programs.findIndex(p => p._id === action.payload._id);
                if (idx !== -1) state.programs[idx] = action.payload;
            })
            .addCase(fetchCustomerRewards.pending, (state) => { state.rewardsLoading = true; })
            .addCase(fetchCustomerRewards.fulfilled, (state, action) => { state.rewardsLoading = false; state.customerRewards = action.payload; })
            .addCase(fetchCustomerRewards.rejected, (state) => { state.rewardsLoading = false; })
            .addCase(fetchRewardAnalytics.pending, (state) => { state.analyticsLoading = true; })
            .addCase(fetchRewardAnalytics.fulfilled, (state, action) => { state.analyticsLoading = false; state.analytics = action.payload; })
            .addCase(fetchRewardAnalytics.rejected, (state) => { state.analyticsLoading = false; });
    }
});

export const { applyReward, removeAppliedReward, clearCustomerRewards } = rewardSlice.actions;
export default rewardSlice.reducer;
