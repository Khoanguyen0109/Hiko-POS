import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getTables, addTable, updateTable } from "../../https";

// Table async thunks
export const fetchTables = createAsyncThunk("tables/fetchAll", async (_, thunkAPI) => {
    try {
        const { data } = await getTables();
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch tables");
    }
});

export const createTable = createAsyncThunk("tables/create", async (tableData, thunkAPI) => {
    try {
        const { data } = await addTable(tableData);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create table");
    }
});

export const editTable = createAsyncThunk("tables/update", async ({ tableId, ...updates }, thunkAPI) => {
    try {
        const { data } = await updateTable({ tableId, ...updates });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update table");
    }
});

const initialState = {
    items: [],
    loading: false,
    error: null
};

const tableSlice = createSlice({
    name: "tables",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all tables
            .addCase(fetchTables.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTables.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload || [];
            })
            .addCase(fetchTables.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch tables";
            })

            // Create table
            .addCase(createTable.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTable.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
            })
            .addCase(createTable.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to create table";
            })

            // Update table
            .addCase(editTable.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(editTable.fulfilled, (state, action) => {
                state.loading = false;
                const updated = action.payload;
                const index = state.items.findIndex(table => table._id === updated._id);
                if (index !== -1) {
                    state.items[index] = updated;
                }
            })
            .addCase(editTable.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to update table";
            });
    }
});

export const { clearError } = tableSlice.actions;
export default tableSlice.reducer;
