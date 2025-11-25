import { API_ENDPOINTS } from "../constants/api";
import { organisationsState } from "../constants/variables";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../services/apiInterceptor";

export const fetchOrganisations = createAsyncThunk(
  "organisations/fetchOrganisations",
  async ({ skip, take, filter }, { rejectWithValue }) => {
    try {
      const params = {};
      if (skip !== 0) params.skip = skip;
      if (take !== 0) params.take = take;
      
      // Transform frontend filter format to backend format
      if (filter) {
        const backendFilter = {};
        
        // Map search to name field
        if (filter.search && filter.search.trim()) {
          backendFilter.name = filter.search.trim();
        }
        
        // Map status to isActive boolean
        if (filter.status && filter.status !== '') {
          if (filter.status === 'ACTIVE') {
            backendFilter.isActive = true;
          } else if (filter.status === 'INACTIVE') {
            backendFilter.isActive = false;
          }
          // If status is empty string or 'ALL', don't add isActive filter
        }
        
        if (Object.keys(backendFilter).length > 0) {
          params.filter = JSON.stringify(backendFilter);
        }
      }

      const response = await axios.get(API_ENDPOINTS.organisation, {
        params: params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchOrganisationById = createAsyncThunk(
  "organisations/fetchOrganisationById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.organisation}/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createOrganisation = createAsyncThunk(
  "organisations/createOrganisation",
  async (organisationData, { rejectWithValue }) => {
    try {
       const response = await axios.post(
        API_ENDPOINTS.organisation,
        organisationData
      );
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateOrganisation = createAsyncThunk(
  "organisations/updateOrganisation",
  async ({ id, organisationData }, { rejectWithValue }) => {
    try {
       const response = await axios.put(
        `${API_ENDPOINTS.organisation}/${id}`,
        organisationData
      );
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteOrganisation = createAsyncThunk(
  "organisations/deleteOrganisation",
  async (id, { rejectWithValue }) => {
    try {
       const response = await axios.delete(
        `${API_ENDPOINTS.organisation}/${id}`
      );
       return { ...response.data, id }; // Include id in response for proper removal from state
    } catch (error) {
      console.error('Delete organisation error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const uploadOrganisation = createAsyncThunk(
  "organisations/uploadOrganisation",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.upload}/organisation`,
        formData
      );
      dispatch(fetchOrganisations({ skip: 0, take: 10, filter: null }));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const organisationsSlice = createSlice({
  name: "organisations",
  initialState: organisationsState,
  reducers: {
    setOrganisations: (state, action) => {
      state.organisations = action.payload;
    },
    setOrganisation: (state, action) => {
      state.organisation = action.payload;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    setFilters: (state, action) => {
      state.filter = { ...state.filter, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganisations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrganisations.fulfilled, (state, action) => {
        state.loading = false;
        state.organisations = action.payload.organisations;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.statusCounts = action.payload.statusCount || state.statusCounts;
        state.error = null;
      })
      .addCase(fetchOrganisations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrganisationById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrganisationById.fulfilled, (state, action) => {
        state.loading = false;
        state.organisation = action.payload;
      })
      .addCase(fetchOrganisationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createOrganisation.pending, (state) => {
        state.loading = true;
      })
      .addCase(createOrganisation.fulfilled, (state, action) => {
        state.loading = false;
        state.organisations.push(action.payload);
      })
      .addCase(createOrganisation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateOrganisation.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOrganisation.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.organisations.findIndex(
          (t) => t.id === action.payload.id
        );
        if (index !== -1) {
          state.organisations[index] = action.payload;
        }
      })
      .addCase(updateOrganisation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteOrganisation.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteOrganisation.fulfilled, (state, action) => {
        state.loading = false;
        state.organisations = state.organisations.filter(
          (t) => t.id !== action.payload.id
        );
      })
      .addCase(deleteOrganisation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setOrganisations, setOrganisation, setMode, setFilters } =
  organisationsSlice.actions;

export default organisationsSlice.reducer;
