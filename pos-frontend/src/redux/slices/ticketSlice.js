// pos-frontend/src/redux/slices/ticketSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketSummary,
  getMyTickets
} from "../../https/ticketApi";

export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async (params, { rejectWithValue }) => {
    try {
      const res = await getTickets(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch tickets");
    }
  }
);

export const fetchTicketSummary = createAsyncThunk(
  "tickets/fetchSummary",
  async (params, { rejectWithValue }) => {
    try {
      const res = await getTicketSummary(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch ticket summary");
    }
  }
);

export const fetchMyTickets = createAsyncThunk(
  "tickets/fetchMyTickets",
  async (params, { rejectWithValue }) => {
    try {
      const res = await getMyTickets(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch your tickets");
    }
  }
);

export const addTicket = createAsyncThunk(
  "tickets/addTicket",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createTicket(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create ticket");
    }
  }
);

export const editTicket = createAsyncThunk(
  "tickets/editTicket",
  async ({ ticketId, ...data }, { rejectWithValue }) => {
    try {
      const res = await updateTicket({ ticketId, ...data });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update ticket");
    }
  }
);

export const removeTicket = createAsyncThunk(
  "tickets/removeTicket",
  async (ticketId, { rejectWithValue }) => {
    try {
      await deleteTicket(ticketId);
      return ticketId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete ticket");
    }
  }
);

const initialState = {
  tickets: [],
  pagination: null,
  loading: false,
  error: null,

  summary: null,
  summaryLoading: false,
  summaryError: null,

  myTickets: null,
  myTicketsLoading: false,
  myTicketsError: null,

  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
};

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearTicketError: (state) => {
      state.error = null;
      state.summaryError = null;
      state.myTicketsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending,    (s) => { s.loading = true;  s.error = null; })
      .addCase(fetchTickets.fulfilled,  (s, a) => { s.loading = false; s.tickets = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchTickets.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchTicketSummary.pending,   (s) => { s.summaryLoading = true;  s.summaryError = null; })
      .addCase(fetchTicketSummary.fulfilled, (s, a) => { s.summaryLoading = false; s.summary = a.payload.data; })
      .addCase(fetchTicketSummary.rejected,  (s, a) => { s.summaryLoading = false; s.summaryError = a.payload; })

      .addCase(fetchMyTickets.pending,   (s) => { s.myTicketsLoading = true;  s.myTicketsError = null; })
      .addCase(fetchMyTickets.fulfilled, (s, a) => { s.myTicketsLoading = false; s.myTickets = a.payload.data; })
      .addCase(fetchMyTickets.rejected,  (s, a) => { s.myTicketsLoading = false; s.myTicketsError = a.payload; })

      .addCase(addTicket.pending,    (s) => { s.createLoading = true;  s.error = null; })
      .addCase(addTicket.fulfilled,  (s, a) => { s.createLoading = false; s.tickets.unshift(a.payload.data); })
      .addCase(addTicket.rejected,   (s, a) => { s.createLoading = false; s.error = a.payload; })

      .addCase(editTicket.pending,   (s) => { s.updateLoading = true;  s.error = null; })
      .addCase(editTicket.fulfilled, (s, a) => {
        s.updateLoading = false;
        const idx = s.tickets.findIndex(t => t._id === a.payload.data._id);
        if (idx !== -1) s.tickets[idx] = a.payload.data;
      })
      .addCase(editTicket.rejected,  (s, a) => { s.updateLoading = false; s.error = a.payload; })

      .addCase(removeTicket.pending,   (s) => { s.deleteLoading = true;  s.error = null; })
      .addCase(removeTicket.fulfilled, (s, a) => { s.deleteLoading = false; s.tickets = s.tickets.filter(t => t._id !== a.payload); })
      .addCase(removeTicket.rejected,  (s, a) => { s.deleteLoading = false; s.error = a.payload; });
  },
});

export const { clearTicketError } = ticketSlice.actions;
export default ticketSlice.reducer;
