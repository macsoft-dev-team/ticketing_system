import { API_ENDPOINTS } from "../constants/api";
import { projectsState } from "../constants/variables";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async ({ skip, take, filter }, { rejectWithValue }) => {
    try {
      const params = {};
      if (skip !== 0) params.skip = skip;
      if (take !== 0) params.take = take;
      if (filter) params.filter = filter;

      const response = await axios.get(API_ENDPOINTS.project, {
        params: params,
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  "projects/fetchProjectById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.project}/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.project,
        projectData,
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

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async ({ id, projectData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.project}/${id}`,
        projectData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_ENDPOINTS.project}/${id}`,
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

export const uploadProject = createAsyncThunk(
  "projects/uploadProject",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.upload}/project`,
        formData,
        { withCredentials: true }
      );
      dispatch(fetchProjects({ skip: 0, take: 10, filter: null }));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState: projectsState,
  reducers: {
    setProjects: (state, action) => {
      state.projects = action.payload;
    },
    setProject: (state, action) => {
      state.project = action.payload;
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
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.projects;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.project = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.projects.findIndex(
          (t) => t.id === action.payload.id
        );
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter(
          (t) => t.id !== action.payload.id
        );
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setProjects, setProject, setMode, setFilters } =
  projectsSlice.actions;

export default projectsSlice.reducer;
