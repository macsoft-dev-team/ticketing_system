import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config";
import { initialState } from "../crudIntitialState";
  

export const fetchData = createAsyncThunk(
  "crud/fetchData",
  async ({ entity, page, size, filter }, { rejectWithValue }) => {
    try {
      const params = {};
      if (page !== undefined) params.page = page;
      if (size !== undefined) params.size = size;
      if (filter !== undefined) params.filter = filter;

      const response = await axios.get(`${API_URL}/${entity}`, { params });
        
      return {
        entity,
        data: Array.isArray(response.data ) ? response.data  : [],
      };
    } catch (error) {
      return rejectWithValue({ entity, message: error.message });
    }
  }
);

export const createData = createAsyncThunk(
  "crud/createData",
  async ({ entity, newData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${entity}`, newData);
      console.log(response.data);
      return { entity, data: response.data };
      
    } catch (error) {
      return rejectWithValue({ entity, message: error.message });
    }
  }
);

export const updateData = createAsyncThunk(
  "crud/updateData",
  async ({ entity, id, updatedData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/${entity}/${id}`,
        updatedData
      );
      return { entity, data: response.data };
    } catch (error) {
      return rejectWithValue({ entity, message: error.message });
    }
  }
);

export const deleteData = createAsyncThunk(
  "crud/deleteData",
  async ({ entity,id }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${entity}/${id}`);
      return { entity, id };
    } catch (error) {
      return rejectWithValue({ entity, message: error.message });
    }
  }
);

// --- Slice ---
const crudSlice = createSlice({
  name: "crud",
  initialState,
  reducers: {
    setCurrentData: (state, action) => {
      const { entity, currentData } = action.payload;
      state[entity].currentData = currentData;
    },
    setData: (state, action) => {
      const { entity, data } = action.payload;
      state[entity].data = data;
      state[entity].loading = false;
      state[entity].error = null;
    },
    setShow: (state, action) => {
      const { entity, show } = action.payload;
      state[entity].show = show;
     },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchData.pending, (state, action) => {
        const entity = action.meta.arg.entity;
        state[entity].loading = true;
        state[entity].error = null;
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        const { entity, data } = action.payload;
        state[entity].loading = false;
        state[entity].data = data;
      })
      .addCase(fetchData.rejected, (state, action) => {
        const entity = action.meta.arg.entity;
        state[entity].loading = false;
        state[entity].error = action.payload?.message || "Unknown error";
      })

      // CREATE
      .addCase(createData.pending, (state, action) => {
        const entity = action.meta.arg.entity;
        state[entity].loading = true;
      })
      .addCase(createData.fulfilled, (state, action) => {
        const { entity, data } = action.payload;
        state[entity].loading = false;
        state[entity].data.push(data);
      })
      .addCase(createData.rejected, (state, action) => {
        const entity = action.meta.arg.entity;
        state[entity].loading = false;
        state[entity].error = action.payload?.message || "Unknown error";
      })

      // UPDATE
      .addCase(updateData.pending, (state, action) => {
        const entity = action.meta.arg.entity;
        state[entity].loading = true;
      })
      .addCase(updateData.fulfilled, (state, action) => {
        const { entity, data } = action.payload;
        const index = state[entity].data.findIndex(
          (item) => item.id === data.id
        );
        if (index !== -1) state[entity].data[index] = data;
        state[entity].loading = false;
        state[entity].currentData = null;
        state[entity].show = false;
      })
      .addCase(updateData.rejected, (state, action) => {
        const entity = action.meta.arg.entity;
        state[entity].loading = false;
        state[entity].error = action.payload?.message || "Unknown error";
      })

      // DELETE
      .addCase(deleteData.pending, (state, action) => {
        const entity = action.meta.arg.entity;
        state[entity].loading = true;
      })
      .addCase(deleteData.fulfilled, (state, action) => {
        const { entity, id } = action.payload;
        state[entity].loading = false;
        state[entity].data = state[entity].data.filter(
          (item) => item.id !== id
        );
      })
      .addCase(deleteData.rejected, (state, action) => {
        const entity = action.meta.arg.entity;
        state[entity].loading = false;
        state[entity].error = action.payload?.message || "Unknown error";
      });
  },
});

export const { setCurrentData, setShow ,setData} = crudSlice.actions;
export default crudSlice.reducer;