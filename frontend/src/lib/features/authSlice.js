import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config";
const user = JSON.parse(sessionStorage.getItem("user"));
const token = sessionStorage.getItem("authToken");

export const login = createAsyncThunk(
  "login/fetchLogin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      const token = response.data.token;
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return response.data;
    } catch (err) {
      const status = err.response?.status;
      const error = err.response?.data?.error;
      error.code = status;
      return rejectWithValue(error || "Registration failed");
    }
  }
);

export const register = createAsyncThunk(
  "register/fetchRegister",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      return response.data;
    } catch (err) {
      const status = err.response?.status;
      const error = err.response?.data?.error;
      error.code = status;
      return rejectWithValue(error || "Registration failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    loading: false,
    token: null,
    isAuthenticated: token ? token : null,
    error: null,
    user: user ? user : null,
  },
  reducers: {
    logout: (state) => {
      sessionStorage.removeItem("authToken");
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        const token = action.payload.token;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.loading = false;
        state.user = action.payload.user;
        sessionStorage.setItem("authToken", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
