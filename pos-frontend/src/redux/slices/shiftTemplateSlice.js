import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as scheduleApi from "../../https/scheduleApi";

// Async thunks
export const fetchShiftTemplates = createAsyncThunk(
    "shiftTemplate/fetchAll",
    async (filters, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.getAllShiftTemplates(filters);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch shift templates");
        }
    }
);

export const fetchActiveShiftTemplates = createAsyncThunk(
    "shiftTemplate/fetchActive",
    async (_, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.getActiveShiftTemplates();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch active shift templates");
        }
    }
);

export const createNewShiftTemplate = createAsyncThunk(
    "shiftTemplate/create",
    async (data, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.createShiftTemplate(data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create shift template");
        }
    }
);

export const updateExistingShiftTemplate = createAsyncThunk(
    "shiftTemplate/update",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.updateShiftTemplate(id, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update shift template");
        }
    }
);

export const removeShiftTemplate = createAsyncThunk(
    "shiftTemplate/delete",
    async (id, { rejectWithValue }) => {
        try {
            await scheduleApi.deleteShiftTemplate(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete shift template");
        }
    }
);

export const toggleShiftTemplateStatus = createAsyncThunk(
    "shiftTemplate/toggleStatus",
    async (id, { rejectWithValue }) => {
        try {
            const response = await scheduleApi.toggleShiftTemplateActiveStatus(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to toggle shift template status");
        }
    }
);

const initialState = {
    shiftTemplates: [],
    activeShiftTemplates: [],
    loading: false,
    error: null,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false
};

const shiftTemplateSlice = createSlice({
    name: "shiftTemplate",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Fetch all shift templates
        builder
            .addCase(fetchShiftTemplates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchShiftTemplates.fulfilled, (state, action) => {
                state.loading = false;
                state.shiftTemplates = action.payload.data;
                state.error = null;
            })
            .addCase(fetchShiftTemplates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch active shift templates
        builder
            .addCase(fetchActiveShiftTemplates.fulfilled, (state, action) => {
                state.activeShiftTemplates = action.payload.data;
            });

        // Create shift template
        builder
            .addCase(createNewShiftTemplate.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createNewShiftTemplate.fulfilled, (state, action) => {
                state.createLoading = false;
                state.shiftTemplates.unshift(action.payload.data);
                if (action.payload.data.isActive) {
                    state.activeShiftTemplates.unshift(action.payload.data);
                }
                state.error = null;
            })
            .addCase(createNewShiftTemplate.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
            });

        // Update shift template
        builder
            .addCase(updateExistingShiftTemplate.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateExistingShiftTemplate.fulfilled, (state, action) => {
                state.updateLoading = false;
                const updated = action.payload.data;
                const index = state.shiftTemplates.findIndex(t => t._id === updated._id);
                if (index !== -1) {
                    state.shiftTemplates[index] = updated;
                }
                const activeIndex = state.activeShiftTemplates.findIndex(t => t._id === updated._id);
                if (activeIndex !== -1) {
                    if (updated.isActive) {
                        state.activeShiftTemplates[activeIndex] = updated;
                    } else {
                        state.activeShiftTemplates.splice(activeIndex, 1);
                    }
                } else if (updated.isActive) {
                    state.activeShiftTemplates.push(updated);
                }
                state.error = null;
            })
            .addCase(updateExistingShiftTemplate.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload;
            });

        // Delete shift template
        builder
            .addCase(removeShiftTemplate.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })
            .addCase(removeShiftTemplate.fulfilled, (state, action) => {
                state.deleteLoading = false;
                state.shiftTemplates = state.shiftTemplates.filter(t => t._id !== action.payload);
                state.activeShiftTemplates = state.activeShiftTemplates.filter(t => t._id !== action.payload);
                state.error = null;
            })
            .addCase(removeShiftTemplate.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload;
            });

        // Toggle status
        builder
            .addCase(toggleShiftTemplateStatus.fulfilled, (state, action) => {
                const updated = action.payload.data;
                const index = state.shiftTemplates.findIndex(t => t._id === updated._id);
                if (index !== -1) {
                    state.shiftTemplates[index] = updated;
                }
            });
    }
});

export const { clearError } = shiftTemplateSlice.actions;
export default shiftTemplateSlice.reducer;

