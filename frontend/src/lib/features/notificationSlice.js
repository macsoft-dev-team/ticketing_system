import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  notifications: [],
  loading: false,
  error: null,
};

const API_URL = import.meta.env.VITE_API_URL;

// Async Thunks
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/notifications`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateNotificationStatus = createAsyncThunk(
  "notifications/updateNotificationStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/notifications/${id}`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
 

// Slice
const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    appendNotification(state, action) {
      state.notifications.push(action.payload);
    }, 
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateNotificationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotificationStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notifications.findIndex(
          (notification) => notification.id === action.payload.id
        );
        if (index !== -1) {
          state.notifications[index] = action.payload;
        }
      })
      .addCase(updateNotificationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
  },
});

export default notificationSlice.reducer;