import { API_ENDPOINTS } from "../constants/api";
import { organisationsState } from "../constants/variables";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchOrganisations = createAsyncThunk(
  "organisations/fetchOrganisations",
  async ({ skip, take, filter }, { rejectWithValue }) => {
    try {
      const params = {};
      if (skip !== 0) params.skip = skip;
      if (take !== 0) params.take = take;
      if (filter) params.filter = filter;

      const response = await axios.get(API_ENDPOINTS.organisation, {
        params: params,
        withCredentials: true,
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
      const response = await axios.get(`${API_ENDPOINTS.organisation}/${id}`, {
        withCredentials: true,
      });
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
        organisationData,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateOrganisation = createAsyncThunk(
  "organisations/updateOrganisation",
  async ({ id, organisationData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.organisation}/${id}`,
        organisationData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteOrganisation = createAsyncThunk(
  "organisations/deleteOrganisation",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_ENDPOINTS.organisation}/${id}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const uploadOrganisation = createAsyncThunk(
  "organisations/uploadOrganisation",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.upload}/organisation`,
        formData,
        { withCredentials: true }
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
