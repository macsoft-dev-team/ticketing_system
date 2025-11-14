import { API_ENDPOINTS } from "../constants/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Service Center Management Actions
export const fetchServiceCenters = createAsyncThunk(
  "serviceCenter/fetchServiceCenters",
  async ({skip,take,filter }, { rejectWithValue }) => {
    try {
      const params = {};
      if(skip !== 0) params.skip = skip ;
      if (take !== 0) params.take = take;
      if (filter) params.filter = JSON.stringify(filter);
      const response = await axios.get(
        `${API_ENDPOINTS.serviceCenter}`,
        {
          params,
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchServiceCenterById = createAsyncThunk(
  "serviceCenter/fetchServiceCenterById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.serviceCenter}/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createServiceCenter = createAsyncThunk(
  "serviceCenter/createServiceCenter",
  async (serviceCenterData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.serviceCenter,
        serviceCenterData,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateServiceCenter = createAsyncThunk(
  "serviceCenter/updateServiceCenter",
  async ({ id, serviceCenterData }, { rejectWithValue }) => {
    try {      
      const response = await axios.put(
        `${API_ENDPOINTS.serviceCenter}/${id}`,
        serviceCenterData,
        { withCredentials: true }
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteServiceCenter = createAsyncThunk(
  "serviceCenter/deleteServiceCenter",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_ENDPOINTS.serviceCenter}/${id}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const assignServiceCenterToTicket = createAsyncThunk(
  "serviceCenter/assignServiceCenterToTicket",
  async ({ ticketId, centerCode }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.serviceCenterAssignment}/tickets/${ticketId}/assign`,
        { centerCode },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeServiceCenterAssignment = createAsyncThunk(
  "serviceCenter/removeServiceCenterAssignment",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_ENDPOINTS.serviceCenterAssignment}/tickets/${ticketId}/assign`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSuggestedServiceCenters = createAsyncThunk(
  "serviceCenter/fetchSuggestedServiceCenters",
  async (state, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.serviceCenterAssignment}/suggested`,
        {
          params: { state },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUnassignedTickets = createAsyncThunk(
  "serviceCenter/fetchUnassignedTickets",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.serviceCenterAssignment}/unassigned-tickets`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchServiceCenterStats = createAsyncThunk(
  "serviceCenter/fetchServiceCenterStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.serviceCenterAssignment}/stats`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const uploadServiceCenters = createAsyncThunk(
  "serviceCenter/uploadServiceCenters",
  async (serviceCentersData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.upload}/service-centers`,
        serviceCentersData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Service Center State
const serviceCenterState = {
  serviceCenters: [],
  serviceCenter: null,
  suggestedServiceCenters: [],
  unassignedTickets: [],
  serviceCenterStats: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
  mode: null, // null | 'create' | 'edit' | 'delete' | 'upload'
  filter: {
    search: "",
    status: "",
    state: "",
  },
};

const serviceCenterSlice = createSlice({
  name: "serviceCenter",
  initialState: serviceCenterState,
  reducers: {
    setServiceCenters: (state, action) => {
      state.serviceCenters = action.payload;
    },
    setServiceCenter: (state, action) => {
      state.serviceCenter = action.payload;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    setFilters: (state, action) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuggestedServiceCenters: (state) => {
      state.suggestedServiceCenters = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Service Centers
      .addCase(fetchServiceCenters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceCenters.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceCenters = action.payload.serviceCenters || [];
        state.statusCount = action.payload.statusCount || {};
        state.totalPages = action.payload.totalPages || 0;
        state.currentPage = action.payload.currentPage || 0;
        state.error = null;
      })
      .addCase(fetchServiceCenters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Service Center By ID
      .addCase(fetchServiceCenterById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceCenterById.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceCenter = action.payload;
        state.error = null;
      })
      .addCase(fetchServiceCenterById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Service Center
      .addCase(createServiceCenter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createServiceCenter.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceCenters.push(action.payload);
        state.error = null;
      })
      .addCase(createServiceCenter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Service Center
      .addCase(updateServiceCenter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateServiceCenter.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.serviceCenters.findIndex(
          (sc) => sc.id === action.payload.id
        );
        if (index !== -1) {
          state.serviceCenters[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateServiceCenter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Service Center
      .addCase(deleteServiceCenter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteServiceCenter.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceCenters = state.serviceCenters.filter(
          (sc) => sc.id !== action.payload.id
        );
        state.error = null;
      })
      .addCase(deleteServiceCenter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Service Center Assignment Actions
      .addCase(assignServiceCenterToTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignServiceCenterToTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(assignServiceCenterToTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove Service Center Assignment
      .addCase(removeServiceCenterAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeServiceCenterAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(removeServiceCenterAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Suggested Service Centers
      .addCase(fetchSuggestedServiceCenters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuggestedServiceCenters.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestedServiceCenters = action.payload.suggestedServiceCenters || action.payload;
        state.error = null;
      })
      .addCase(fetchSuggestedServiceCenters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Unassigned Tickets
      .addCase(fetchUnassignedTickets.fulfilled, (state, action) => {
        state.unassignedTickets = action.payload.unassignedTickets || action.payload;
        state.error = null;
      })
      .addCase(fetchUnassignedTickets.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch Service Center Stats
      .addCase(fetchServiceCenterStats.fulfilled, (state, action) => {
        state.serviceCenterStats = action.payload.serviceCenterStats || action.payload;
        state.error = null;
      })
      .addCase(fetchServiceCenterStats.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Upload Service Centers
      .addCase(uploadServiceCenters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadServiceCenters.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Optionally add uploaded service centers to the list
        if (action.payload.results?.successful) {
          const newServiceCenters = action.payload.results.successful.map(item => item.serviceCenter);
          state.serviceCenters.push(...newServiceCenters);
        }
      })
      .addCase(uploadServiceCenters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setServiceCenters, 
  setServiceCenter, 
  setMode, 
  setFilters, 
  clearError, 
  clearSuggestedServiceCenters 
} = serviceCenterSlice.actions;

export default serviceCenterSlice.reducer;
