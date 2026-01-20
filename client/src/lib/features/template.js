import { API_ENDPOINTS } from "../constants/api";
import { templatesState } from "../constants/variables";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchTemplates = createAsyncThunk(
  "templates/fetchTemplates",
  async ({ skip, take, filter }, { rejectWithValue }) => {
    try {
      const params = {};
      if (skip !== 0) params.skip = skip;
      if (take !== 0) params.take = take;
      if (filter) params.filter = filter;

      const response = await axios.get(API_ENDPOINTS.templates, {
        params: params,
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchTemplateById = createAsyncThunk(
  "templates/fetchTemplateById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.templates}/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createTemplate = createAsyncThunk(
  "templates/createTemplate",
  async (templateData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_ENDPOINTS.templates, templateData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateTemplate = createAsyncThunk(
  "templates/updateTemplate",
  async ({ id, templateData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.templates}/${id}`,
        templateData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  "templates/deleteTemplate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_ENDPOINTS.templates}/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const templatesSlice = createSlice({
  name: "templates",
  initialState: templatesState,
  reducers: {
    setTemplates: (state, action) => {
      state.templates = action.payload;
    },
    setTemplate: (state, action) => {
      state.template = action.payload;
    },
    setMode: (state, action) => {
      // Reset all modes to false first
      Object.keys(state.mode).forEach(key => {
        state.mode[key] = false;
      });
      // Set the specified mode to true if provided
      if (action.payload) {
        state.mode[action.payload] = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload.templates;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.error = null;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTemplateById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTemplateById.fulfilled, (state, action) => {
        state.loading = false;
        state.template = action.payload;
      })
      .addCase(fetchTemplateById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTemplate.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates.push(action.payload);
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTemplate.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.templates.findIndex(
          (t) => t.id === action.payload.id
        );
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTemplate.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = state.templates.filter(
          (t) => t.id !== action.payload.id
        );
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setTemplates, setTemplate, setMode } = templatesSlice.actions;

export default templatesSlice.reducer;
