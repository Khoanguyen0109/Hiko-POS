import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as scheduleApi from "../../https/scheduleApi";

// Async thunks
export const fetchSchedulesByWeek = createAsyncThunk(
    "schedule/fetchByWeek",
    async ({ year, week }, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.getSchedulesByWeek(year, week);
            return { data: response.data, year, week };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch schedules");
        }
    }
);

export const fetchSchedulesByDateRange = createAsyncThunk(
    "schedule/fetchByDateRange",
    async ({ startDate, endDate }, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.getSchedulesByDateRange({ startDate, endDate });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch schedules");
        }
    }
);

export const createNewSchedule = createAsyncThunk(
    "schedule/create",
    async (data, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.createSchedule(data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create schedule");
        }
    }
);

export const bulkCreateNewSchedules = createAsyncThunk(
    "schedule/bulkCreate",
    async (schedules, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.bulkCreateSchedules(schedules);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create schedules");
        }
    }
);

export const updateExistingSchedule = createAsyncThunk(
    "schedule/update",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.updateSchedule(id, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update schedule");
        }
    }
);

export const removeSchedule = createAsyncThunk(
    "schedule/delete",
    async (id, { rejectWithValue }) => {
        try {
            await scheduleApi.deleteSchedule(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete schedule");
        }
    }
);

export const assignMember = createAsyncThunk(
    "schedule/assignMember",
    async ({ scheduleId, memberId }, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.assignMemberToShift(scheduleId, memberId);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to assign member");
        }
    }
);

export const unassignMember = createAsyncThunk(
    "schedule/unassignMember",
    async ({ scheduleId, memberId }, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.unassignMemberFromShift(scheduleId, memberId);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to unassign member");
        }
    }
);

export const updateScheduleMemberStatus = createAsyncThunk(
    "schedule/updateMemberStatus",
    async ({ scheduleId, memberId, status }, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.updateMemberStatus(scheduleId, memberId, status);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update member status");
        }
    }
);

const initialState = {
    schedules: [],
    currentWeek: null,
    currentYear: null,
    loading: false,
    error: null,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
    assignLoading: false
};

const scheduleSlice = createSlice({
    name: "schedule",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentWeek: (state, action) => {
            state.currentWeek = action.payload.week;
            state.currentYear = action.payload.year;
        }
    },
    extraReducers: (builder) => {
        // Fetch schedules by week
        builder
            .addCase(fetchSchedulesByWeek.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSchedulesByWeek.fulfilled, (state, action) => {
                state.loading = false;
                state.schedules = action.payload.data.data;
                state.currentWeek = action.payload.week;
                state.currentYear = action.payload.year;
                state.error = null;
            })
            .addCase(fetchSchedulesByWeek.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch schedules by date range
        builder
            .addCase(fetchSchedulesByDateRange.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSchedulesByDateRange.fulfilled, (state, action) => {
                state.loading = false;
                state.schedules = action.payload.data;
                state.error = null;
            })
            .addCase(fetchSchedulesByDateRange.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Create schedule
        builder
            .addCase(createNewSchedule.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createNewSchedule.fulfilled, (state, action) => {
                state.createLoading = false;
                state.schedules.push(action.payload.data);
                state.error = null;
            })
            .addCase(createNewSchedule.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
            });

        // Bulk create schedules
        builder
            .addCase(bulkCreateNewSchedules.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(bulkCreateNewSchedules.fulfilled, (state, action) => {
                state.createLoading = false;
                if (action.payload.data && Array.isArray(action.payload.data)) {
                    state.schedules.push(...action.payload.data);
                }
                state.error = null;
            })
            .addCase(bulkCreateNewSchedules.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
            });

        // Update schedule
        builder
            .addCase(updateExistingSchedule.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateExistingSchedule.fulfilled, (state, action) => {
                state.updateLoading = false;
                const updated = action.payload.data;
                const index = state.schedules.findIndex(s => s._id === updated._id);
                if (index !== -1) {
                    state.schedules[index] = updated;
                }
                state.error = null;
            })
            .addCase(updateExistingSchedule.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload;
            });

        // Delete schedule
        builder
            .addCase(removeSchedule.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })
            .addCase(removeSchedule.fulfilled, (state, action) => {
                state.deleteLoading = false;
                state.schedules = state.schedules.filter(s => s._id !== action.payload);
                state.error = null;
            })
            .addCase(removeSchedule.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload;
            });

        // Assign member
        builder
            .addCase(assignMember.pending, (state) => {
                state.assignLoading = true;
                state.error = null;
            })
            .addCase(assignMember.fulfilled, (state, action) => {
                state.assignLoading = false;
                const updated = action.payload.data;
                const index = state.schedules.findIndex(s => s._id === updated._id);
                if (index !== -1) {
                    state.schedules[index] = updated;
                }
                state.error = null;
            })
            .addCase(assignMember.rejected, (state, action) => {
                state.assignLoading = false;
                state.error = action.payload;
            });

        // Unassign member
        builder
            .addCase(unassignMember.pending, (state) => {
                state.assignLoading = true;
                state.error = null;
            })
            .addCase(unassignMember.fulfilled, (state, action) => {
                state.assignLoading = false;
                const updated = action.payload.data;
                const index = state.schedules.findIndex(s => s._id === updated._id);
                if (index !== -1) {
                    state.schedules[index] = updated;
                }
                state.error = null;
            })
            .addCase(unassignMember.rejected, (state, action) => {
                state.assignLoading = false;
                state.error = action.payload;
            });

        // Update member status
        builder
            .addCase(updateScheduleMemberStatus.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateScheduleMemberStatus.fulfilled, (state, action) => {
                state.updateLoading = false;
                const updated = action.payload.data;
                const index = state.schedules.findIndex(s => s._id === updated._id);
                if (index !== -1) {
                    state.schedules[index] = updated;
                }
                state.error = null;
            })
            .addCase(updateScheduleMemberStatus.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, setCurrentWeek } = scheduleSlice.actions;
export default scheduleSlice.reducer;

