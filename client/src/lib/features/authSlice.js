import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../services/apiInterceptor";
import { API_ENDPOINTS, API_URL } from "../../lib/constants/api";
import { SessionManager } from "../utils/sessionManager";

const user = SessionManager.getUser();
const token = SessionManager.getToken();

// Configure axios defaults
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const initialState = {
  user: user || null,
  token: token || null,
  isAuthenticated: !!(user && token),
  permissions: [],
  loading: false,
  error: null,
  menuItems: [],
};

export const login = createAsyncThunk(
  "auth/login",
  async ({ phone, password }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(API_ENDPOINTS.login, { phone, password });
      const { user, token, message } = response.data;
      
      if (!user || !token) {
        throw new Error(message || "Login failed");
      }

      // Set token for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Store in session
      SessionManager.setUser(user);
      SessionManager.setToken(token);
      
      dispatch(setUser(user));
      dispatch(setToken(token));
      
      return { user, token };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message || "Login failed";
      dispatch(setAuthError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async ({ name, phone, password }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(API_ENDPOINTS.register, { name, phone, password });
      const { message } = response.data;
      
      return { message: message || "Registration successful" };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message || "Registration failed";
      dispatch(setAuthError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { dispatch, rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token || SessionManager.getToken();
      
      if (!token) {
        dispatch(logout());
        return rejectWithValue("No token found");
      }

      // Set token for the request
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get(`${API_URL}/user/me`); // Fixed: use /user instead of /users
      const { user } = response.data;
      
      if (user) {
        dispatch(setUser(user));
        SessionManager.setUser(user);
        return { user };
      } else {
        dispatch(logout());
        return rejectWithValue("User not found");
      }
    } catch (error) {
      dispatch(logout());
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      // Call logout endpoint if available
      await axios.post(API_ENDPOINTS.logout);
    } catch (error) {
      // Ignore errors on logout - server might be down or token already invalid
      console.warn('Logout API call failed:', error.message);
    } finally {
      // Always clear local state regardless of API call result
      dispatch(logout());
    }
    return { success: true };
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!(action.payload && state.token);
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!(state.user && action.payload);
      if (action.payload) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${action.payload}`;
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
       state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.permissions = [];
      state.error = null;
      
      try {
        SessionManager.logout();
        delete axios.defaults.headers.common['Authorization'];
       } catch (error) {
        console.error('Error during session cleanup:', error);
      }
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setUser,
  setToken,
  setPermissions,
  setAuthLoading,
  setAuthError,
  logout,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;
