import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCustomerRewards } from "../../https";

export const fetchCustomerRewards = createAsyncThunk(
  "rewards/fetchCustomerRewards",
  async (customerId, thunkAPI) => {
    try {
      const { data } = await getCustomerRewards(customerId);
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch customer rewards"
      );
    }
  }
);

const rewardSlice = createSlice({
  name: "rewards",
  initialState: {
    customerRewards: null,
    rewardsLoading: false,
    appliedReward: null,
  },
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerRewards.pending, (state) => {
        state.rewardsLoading = true;
      })
      .addCase(fetchCustomerRewards.fulfilled, (state, action) => {
        state.rewardsLoading = false;
        state.customerRewards = action.payload;
      })
      .addCase(fetchCustomerRewards.rejected, (state) => {
        state.rewardsLoading = false;
      });
  },
});

export const { applyReward, removeAppliedReward, clearCustomerRewards } =
  rewardSlice.actions;
export default rewardSlice.reducer;
