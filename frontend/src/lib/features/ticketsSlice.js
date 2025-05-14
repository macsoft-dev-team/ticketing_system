import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config";

const initialState = {
  data: [],
  currentData: null,
  filter: {
    status: "OPEN",
  },
  loading: false,
  error: null,
  currentPage: 0,
  totalPages: 0,
  show: false,
};

export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async ({ page, size, filter }, { rejectWithValue }) => {
    try {
      const params = {};
      if (page && page !== 0) params.skip = page;
      if (size && size !== 0) params.take = size;
      if (filter) params.filter = filter;
      const response = await axios.get(`${API_URL}/ticket`, {
        params: params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTicket = createAsyncThunk(
  "tickets/fetchTicket",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/ticket/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTicket = createAsyncThunk(
  "tickets/createTicket",
  async (ticketData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/ticket`, ticketData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTicket = createAsyncThunk(
  "tickets/updateTicket",
  async ({ id, ticketData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/ticket/${id}`, ticketData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateStatus = createAsyncThunk(
  "tickets/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/ticket/status/${id}`, {
        status,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTicket = createAsyncThunk(
  "tickets/deleteTicket",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/ticket/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const ticketsSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    setCurrentTicket: (state, action) => {
      state.currentData = action.payload;
    },
    setData: (state, action) => {
      state.data = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setShow: (state, action) => {
      state.show = action.payload;
    },
    addConversationMessage: (state, action) => {
      if (state.currentData && state.currentData.messages) {
        state.currentData.messages.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      })
      .addCase(fetchTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.currentData = action.payload;
      })
      .addCase(fetchTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      })
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      })
      .addCase(updateTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (ticket) => ticket.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      })
      .addCase(deleteTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(
          (ticket) => ticket.id !== action.payload
        );
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      })
      .addCase(updateStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (ticket) => ticket.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      });
  },
});

export const {
  setCurrentTicket,
  setData,
  setFilter,
  setShow,
  addConversationMessage,
} = ticketsSlice.actions;
export default ticketsSlice.reducer;
