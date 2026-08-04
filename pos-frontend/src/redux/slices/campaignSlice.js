import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCampaigns, getCampaignDashboardAnalytics } from "../../https";

export const fetchCampaigns = createAsyncThunk(
  "campaigns/fetchCampaigns",
  async (_, thunkAPI) => {
    try {
      const { data } = await getCampaigns();
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch campaigns"
      );
    }
  }
);

export const fetchCampaignDashboardAnalytics = createAsyncThunk(
  "campaigns/fetchDashboardAnalytics",
  async ({ startDate, endDate, campaignId }, thunkAPI) => {
    try {
      const params = { startDate, endDate };
      if (campaignId) {
        params.campaignId = campaignId;
      }
      const { data } = await getCampaignDashboardAnalytics(params);
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch campaign analytics"
      );
    }
  }
);

const initialState = {
  campaigns: [],
  campaignsLoading: false,
  campaignsError: null,
  dashboardAnalytics: null,
  dashboardLoading: false,
  dashboardError: null,
};

const campaignSlice = createSlice({
  name: "campaigns",
  initialState,
  reducers: {
    clearCampaignDashboard: (state) => {
      state.dashboardAnalytics = null;
      state.dashboardError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.campaignsLoading = true;
        state.campaignsError = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.campaignsLoading = false;
        state.campaigns = action.payload ?? [];
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.campaignsLoading = false;
        state.campaignsError = action.payload;
      })
      .addCase(fetchCampaignDashboardAnalytics.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(fetchCampaignDashboardAnalytics.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardAnalytics = action.payload;
      })
      .addCase(fetchCampaignDashboardAnalytics.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = action.payload;
      });
  },
});

export const { clearCampaignDashboard } = campaignSlice.actions;
export default campaignSlice.reducer;
