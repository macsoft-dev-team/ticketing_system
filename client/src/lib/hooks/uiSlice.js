import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarCollapsed: false,
  theme: 'light',
  isMobile: false,
  loading: false,
  notification: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setIsMobile: (state, action) => {
      state.isMobile = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setNotification: (state, action) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  setIsMobile,
  setLoading,
  setNotification,
  clearNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
