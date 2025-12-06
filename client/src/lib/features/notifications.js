import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationsState } from "../../lib/constants/variables";
import { API_ENDPOINTS } from "../../lib/constants/api";
import axios from "../services/apiInterceptor";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ skip = 0, take = 10, filter = "all" }, { rejectWithValue }) => {
    try {
       const params = {};
      if (skip !== 0) params.skip = skip;
      if (take !== 0) params.take = take;
      if (filter) params.filter = filter;
      
       const response = await axios.get(API_ENDPOINTS.notifications, {
        params,
        withCredentials: true,
      });
            return response.data;
    } catch (error) {
      console.error('❌ Fetch notifications error:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchNotificationsByFilter = createAsyncThunk(
  "notifications/fetchNotificationsByFilter",
  async ({ filter, skip = 0, take = 20 }, { rejectWithValue }) => {
    try {
      const params = { skip, take, filter };
      const response = await axios.get(API_ENDPOINTS.notifications, {
        params,
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNotificationCounts = createAsyncThunk(
  "notifications/fetchNotificationCounts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.notifications}/counts`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNotificationById = createAsyncThunk(
  "notifications/fetchNotificationById",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.notifications}/${notificationId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createNotification = createAsyncThunk(
  "notifications/createNotification",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_ENDPOINTS.notifications, data, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateNotification = createAsyncThunk(
  "notifications/updateNotification",
  async ({ notificationId, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.notifications}/${notificationId}/read`,
        data,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const enableConversation = createAsyncThunk(
  "notifications/enableConversation",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.notifications}/${notificationId}/enable-conversation`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { notifications } = getState().notification;
      const unreadNotifications = notifications.filter(n => !n.seen);
      
      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(notification =>
          axios.put(
            `${API_ENDPOINTS.notifications}/${notification.id}`,
            {},
            { withCredentials: true }
          )
        )
      );
      
      return unreadNotifications.map(n => n.id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markTicketNotificationsAsSeen = createAsyncThunk(
  "notifications/markTicketNotificationsAsSeen",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.notifications}/ticket/${ticketId}/mark-seen`,
        {},
        { withCredentials: true }
      );
      return { ticketId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState: notificationsState,
  reducers: {
    setNotification: (state, action) => {
      state.notification = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setCurrentFilter: (state, action) => {
      state.currentFilter = action.payload;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    addNotification: (state, action) => {
      // Add new notification to the beginning of the list
      state.notifications.unshift(action.payload);
      
      // Update unread count
      if (!action.payload.seen) {
        state.unreadCount = (state.unreadCount || 0) + 1;
      }
      
      // Update total count
      state.totalCount = (state.totalCount || 0) + 1;
    },
    markNotificationAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.seen) {
        notification.seen = true;
        state.unreadCount = Math.max(0, (state.unreadCount || 0) - 1);
      }
    },
    clearError: (state) => {
      state.error = null;
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
        // Handle new API response format: {success: true, data: [...], count: 70}
        if (action.payload.success && action.payload.data) {
          state.notifications = action.payload.data;
          state.totalPages = action.payload.totalPages || 1;
          state.currentPage = action.payload.currentPage || 1;
          state.totalCount = action.payload.count || action.payload.data.length;
          state.unreadCount = action.payload.data.filter(n => !n.seen).length;
        } else {
          // Fallback for old format
          state.notifications = action.payload.notifications || action.payload;
          state.totalPages = action.payload.totalPages || 1;
          state.currentPage = action.payload.currentPage || 1;
          state.totalCount = Array.isArray(state.notifications) ? state.notifications.length : 0;
          state.unreadCount = Array.isArray(state.notifications) ? state.notifications.filter(n => !n.seen).length : 0;
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch notifications";
      })
      .addCase(fetchNotificationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationById.fulfilled, (state, action) => {
        state.loading = false;
        state.notification = action.payload;
        state.error = null;
      })
      .addCase(fetchNotificationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch notifications";
      })
      .addCase(createNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications.push(action.payload);
        state.error = null;
        state.mode = {
          create: false,
          edit: false,
          view: false,
          confirmDelete: false,
        };
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create notification";
      })
      .addCase(updateNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotification.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notifications.findIndex(
          (m) => m.id === action.payload.id
        );
        if (index !== -1) {
          state.notifications[index] = action.payload;
        }
        state.error = null;
        state.mode = {
          create: false,
          edit: false,
          view: false,
          confirmDelete: false,
        };
      })
      .addCase(updateNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update notification";
      })
      .addCase(enableConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enableConversation.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notifications.findIndex(
          (n) => n.id === action.payload.id
        );
        if (index !== -1) {
          state.notifications[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(enableConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to enable conversation";
      })
      .addCase(fetchNotificationsByFilter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsByFilter.fulfilled, (state, action) => {
        state.loading = false;
        // Handle new API response format: {success: true, data: [...], count: 70}
        if (action.payload.success && action.payload.data) {
          state.notifications = action.payload.data;
          state.totalPages = action.payload.totalPages || 1;
          state.currentPage = action.payload.currentPage || 1;
        } else {
          // Fallback for old format
          state.notifications = action.payload.notifications || action.payload;
          state.totalPages = action.payload.totalPages || 1;
          state.currentPage = action.payload.currentPage || 1;
        }
      })
      .addCase(fetchNotificationsByFilter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch notifications";
      })
      .addCase(fetchNotificationCounts.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchNotificationCounts.fulfilled, (state, action) => {
        state.counts = action.payload;
      })
      .addCase(fetchNotificationCounts.rejected, (state, action) => {
        state.error = action.payload || "Failed to fetch notification counts";
      })
      .addCase(markAllAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllAsRead.fulfilled, (state, action) => {
        state.loading = false;
        // Mark all notifications as read
        state.notifications.forEach(notification => {
          if (action.payload.includes(notification.id)) {
            notification.seen = true;
          }
        });
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to mark all notifications as read";
      })
      .addCase(markTicketNotificationsAsSeen.pending, (state) => {
        state.error = null;
      })
      .addCase(markTicketNotificationsAsSeen.fulfilled, (state, action) => {
        const { ticketId, data } = action.payload;
        // Mark ticket-related notifications as seen
        state.notifications.forEach(notification => {
          if (notification.notification?.ticketId === parseInt(ticketId) && !notification.seen) {
            notification.seen = true;
            notification.seenAt = new Date().toISOString();
          }
        });
        // Update unread count
        const newUnreadCount = state.notifications.filter(n => !n.seen).length;
        state.unreadCount = newUnreadCount;
      })
      .addCase(markTicketNotificationsAsSeen.rejected, (state, action) => {
        state.error = action.payload || "Failed to mark ticket notifications as seen";
      });
  },
});

export const { 
  setNotification, 
  setFilter, 
  setCurrentFilter, 
  setMode, 
  addNotification, 
  markNotificationAsRead,
  clearError 
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
