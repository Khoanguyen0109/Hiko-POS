import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCampaigns,
  getCampaignDashboardAnalytics,
  addCampaign,
  updateCampaign,
  deactivateCampaign,
} from "../../https";

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

export const createCampaign = createAsyncThunk(
  "campaigns/create",
  async (campaignData, thunkAPI) => {
    try {
      const { data } = await addCampaign(campaignData);
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create campaign"
      );
    }
  }
);

export const editCampaign = createAsyncThunk(
  "campaigns/edit",
  async ({ campaignId, ...campaignData }, thunkAPI) => {
    try {
      const { data } = await updateCampaign({ campaignId, ...campaignData });
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update campaign"
      );
    }
  }
);

export const deactivateCampaignAction = createAsyncThunk(
  "campaigns/deactivate",
  async (campaignId, thunkAPI) => {
    try {
      const { data } = await deactivateCampaign(campaignId);
      return data.data ?? { _id: campaignId, isActive: false };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to deactivate campaign"
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
    clearError: (state) => {
      state.campaignsError = null;
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
      })
      .addCase(createCampaign.pending, (state) => {
        state.campaignsLoading = true;
        state.campaignsError = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.campaignsLoading = false;
        if (action.payload) {
          state.campaigns.unshift(action.payload);
        }
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.campaignsLoading = false;
        state.campaignsError = action.payload;
      })
      .addCase(editCampaign.pending, (state) => {
        state.campaignsLoading = true;
        state.campaignsError = null;
      })
      .addCase(editCampaign.fulfilled, (state, action) => {
        state.campaignsLoading = false;
        const index = state.campaigns.findIndex(
          (campaign) => campaign._id === action.payload._id
        );
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
      })
      .addCase(editCampaign.rejected, (state, action) => {
        state.campaignsLoading = false;
        state.campaignsError = action.payload;
      })
      .addCase(deactivateCampaignAction.pending, (state) => {
        state.campaignsLoading = true;
        state.campaignsError = null;
      })
      .addCase(deactivateCampaignAction.fulfilled, (state, action) => {
        state.campaignsLoading = false;
        const index = state.campaigns.findIndex(
          (campaign) => campaign._id === action.payload._id
        );
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
      })
      .addCase(deactivateCampaignAction.rejected, (state, action) => {
        state.campaignsLoading = false;
        state.campaignsError = action.payload;
      });
  },
});

export const { clearCampaignDashboard, clearError } = campaignSlice.actions;
export default campaignSlice.reducer;
