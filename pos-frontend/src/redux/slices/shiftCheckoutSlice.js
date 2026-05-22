import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as shiftCheckoutApi from "../../https/shiftCheckoutApi";

export const fetchMyShiftCheckouts = createAsyncThunk(
  "shiftCheckout/fetchMyToday",
  async (params, { rejectWithValue }) => {
    try {
      const response = await shiftCheckoutApi.getMyShiftCheckoutsToday(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load your shifts"
      );
    }
  }
);

export const fetchShiftCheckoutPreview = createAsyncThunk(
  "shiftCheckout/fetchPreview",
  async ({ scheduleId, memberId }, { rejectWithValue }) => {
    try {
      const response = await shiftCheckoutApi.getShiftCheckoutPreview(
        scheduleId,
        memberId
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load preview"
      );
    }
  }
);

export const submitShiftCheckIn = createAsyncThunk(
  "shiftCheckout/checkIn",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await shiftCheckoutApi.submitShiftCheckIn(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to check in"
      );
    }
  }
);

export const submitShiftCheckout = createAsyncThunk(
  "shiftCheckout/submit",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await shiftCheckoutApi.submitShiftCheckout(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit checkout"
      );
    }
  }
);

export const fetchDayShiftCheckouts = createAsyncThunk(
  "shiftCheckout/fetchDay",
  async (date, { rejectWithValue }) => {
    try {
      const response = await shiftCheckoutApi.getDayShiftCheckouts(date);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load day checkouts"
      );
    }
  }
);

export const deleteShiftCheckout = createAsyncThunk(
  "shiftCheckout/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await shiftCheckoutApi.deleteShiftCheckout(id);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete checkout"
      );
    }
  }
);

export const fetchShiftCheckoutList = createAsyncThunk(
  "shiftCheckout/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      const response = await shiftCheckoutApi.getShiftCheckoutList(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load shift checkouts"
      );
    }
  }
);

const initialState = {
  myShifts: [],
  myShiftsDate: null,
  dayCheckouts: [],
  dayDate: null,
  listCheckouts: [],
  listSummary: null,
  listLoading: false,
  listError: null,
  deleteLoading: false,
  checkInLoading: false,
  preview: null,
  loading: false,
  previewLoading: false,
  submitLoading: false,
  dayLoading: false,
  error: null,
};

const shiftCheckoutSlice = createSlice({
  name: "shiftCheckout",
  initialState,
  reducers: {
    clearShiftCheckoutError: (state) => {
      state.error = null;
    },
    clearPreview: (state) => {
      state.preview = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyShiftCheckouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyShiftCheckouts.fulfilled, (state, action) => {
        state.loading = false;
        state.myShifts = action.payload.data || [];
        state.myShiftsDate = action.payload.date;
      })
      .addCase(fetchMyShiftCheckouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchShiftCheckoutPreview.pending, (state) => {
        state.previewLoading = true;
        state.error = null;
      })
      .addCase(fetchShiftCheckoutPreview.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.preview = action.payload.data;
      })
      .addCase(fetchShiftCheckoutPreview.rejected, (state, action) => {
        state.previewLoading = false;
        state.error = action.payload;
      })
      .addCase(submitShiftCheckout.pending, (state) => {
        state.submitLoading = true;
        state.error = null;
      })
      .addCase(submitShiftCheckout.fulfilled, (state) => {
        state.submitLoading = false;
        state.preview = null;
      })
      .addCase(submitShiftCheckout.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchDayShiftCheckouts.pending, (state) => {
        state.dayLoading = true;
        state.error = null;
      })
      .addCase(fetchDayShiftCheckouts.fulfilled, (state, action) => {
        state.dayLoading = false;
        state.dayCheckouts = action.payload.data || [];
        state.dayDate = action.payload.date;
      })
      .addCase(fetchDayShiftCheckouts.rejected, (state, action) => {
        state.dayLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchShiftCheckoutList.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchShiftCheckoutList.fulfilled, (state, action) => {
        state.listLoading = false;
        state.listCheckouts = action.payload.data?.checkouts || [];
        state.listSummary = action.payload.data?.summary || null;
      })
      .addCase(fetchShiftCheckoutList.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      })
      .addCase(deleteShiftCheckout.pending, (state) => {
        state.deleteLoading = true;
        state.listError = null;
      })
      .addCase(deleteShiftCheckout.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const id = action.meta.arg;
        const removed =
          state.listCheckouts.find((c) => c._id === id) ||
          state.dayCheckouts.find((c) => c._id === id);

        state.listCheckouts = state.listCheckouts.filter((c) => c._id !== id);
        state.dayCheckouts = state.dayCheckouts.filter((c) => c._id !== id);

        const scheduleId = action.payload.data?.schedule;
        if (scheduleId) {
          const scheduleIdStr = String(scheduleId);
          state.myShifts = state.myShifts.map((row) => {
            if (
              row.checkout?._id === id ||
              String(row.schedule?._id) === scheduleIdStr
            ) {
              return {
                ...row,
                checkout: null,
                checkoutStatus: "not_submitted",
              };
            }
            return row;
          });
        }

        if (removed && state.listSummary) {
          state.listSummary.totalCount = Math.max(
            0,
            state.listSummary.totalCount - 1
          );
          if (removed.status === "balanced") {
            state.listSummary.balancedCount = Math.max(
              0,
              state.listSummary.balancedCount - 1
            );
          } else if (removed.status === "mismatch") {
            state.listSummary.mismatchCount = Math.max(
              0,
              state.listSummary.mismatchCount - 1
            );
          }
          state.listSummary.totalCashDifference -= removed.cashDifference || 0;
          state.listSummary.totalBankingDifference -=
            removed.bankingDifference || 0;
        }
      })
      .addCase(deleteShiftCheckout.rejected, (state, action) => {
        state.deleteLoading = false;
        state.listError = action.payload;
      })
      .addCase(submitShiftCheckIn.pending, (state) => {
        state.checkInLoading = true;
        state.error = null;
      })
      .addCase(submitShiftCheckIn.fulfilled, (state, action) => {
        state.checkInLoading = false;
        const checkIn = action.payload.data;
        const scheduleId = String(checkIn.schedule?._id || checkIn.schedule);
        const memberId = String(checkIn.member?._id || checkIn.member);

        state.myShifts = state.myShifts.map((row) => {
          const rowScheduleId = String(row.schedule?._id);
          const rowMemberId = String(row.member?._id || "");
          if (
            rowScheduleId === scheduleId &&
            (!rowMemberId || rowMemberId === memberId)
          ) {
            return {
              ...row,
              checkIn,
              checkInStatus: "checked_in",
            };
          }
          return row;
        });
      })
      .addCase(submitShiftCheckIn.rejected, (state, action) => {
        state.checkInLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearShiftCheckoutError, clearPreview } =
  shiftCheckoutSlice.actions;
export default shiftCheckoutSlice.reducer;
