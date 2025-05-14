import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config";

const initialState = {
  conversation: {
    data: [],
    currentData: null,
    loading: false,
    error: null,
    show: false,
  },
};

// --- Async Thunks ---
export const fetchConversation = createAsyncThunk(
  "conversation/fetchConversation",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/conversation/${ticketId}`);
      return { data: response.data };
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

export const createMessage = createAsyncThunk(
  "conversation/createMessage",
  async ({ ticketId, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/conversation/${ticketId}`,
        message
      );
      return { data: response.data };
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  }
);

// --- Slice ---
const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    setCurrentMessage: (state, action) => {
      state.conversation.currentData = action.payload;
    },
    setShowConversation: (state, action) => {
      state.conversation.show = action.payload;
    },
    setConversation: (state, action) => {
      state.conversation.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchConversation.pending, (state) => {
        state.conversation.loading = true;
        state.conversation.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.conversation.loading = false;
        state.conversation.data = action.payload.data;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.conversation.loading = false;
        state.conversation.error = action.payload?.message || "Unknown error";
      })

      // CREATE
      .addCase(createMessage.pending, (state) => {
        state.conversation.loading = true;
      })
      .addCase(createMessage.fulfilled, (state, action) => {
        state.conversation.loading = false;
        state.conversation.data.push(action.payload.data);
      })
      .addCase(createMessage.rejected, (state, action) => {
        state.conversation.loading = false;
        state.conversation.error = action.payload?.message || "Unknown error";
      });
  },
});

export const { setCurrentMessage, setShowConversation, setConversation } =
  conversationSlice.actions;
export default conversationSlice.reducer;
