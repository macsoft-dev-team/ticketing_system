import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { initialState } from "../constants/variables";
import axios from "../services/apiInterceptor";
import { API_ENDPOINTS } from "../constants/api";
// Mock LMS service for fetching device details
const fetchDeviceDetailsFromLMS = async (controllerNumber) => {
  // Simulate API call to LMS
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock device details
  return {
    controllerNumber,
    imei: `IMEI-${Math.random().toString(36).substr(2, 15)}`,
    hp: Math.floor(Math.random() * 50) + 5,
    motorType: ["AC Motor", "DC Motor", "Servo Motor", "Stepper Motor"][
      Math.floor(Math.random() * 4)
    ],
    deviceModel: `Model-${Math.random()
      .toString(36)
      .substr(2, 5)
      .toUpperCase()}`,
    installationDate: new Date(
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0],
    state: [
      "Karnataka",
      "Maharashtra",
      "Tamil Nadu",
      "Kerala",
      "Andhra Pradesh",
      "Gujarat",
    ][Math.floor(Math.random() * 6)],
  };
};

// Async thunk for fetching device details
export const fetchDeviceDetails = createAsyncThunk(
  "tickets/fetchDeviceDetails",
  async (controllerNumber, { rejectWithValue }) => {
    try {
      const deviceDetails = await fetchDeviceDetailsFromLMS(controllerNumber);
      return deviceDetails;
    } catch (error) {
      return rejectWithValue("Failed to fetch device details from LMS");
    }
  }
);

 
export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = {};
      if (params.skip && params.skip !== 0) queryParams.skip = params.skip;
      if (params.take && params.take !== 0) queryParams.take = params.take;
      if (params.filter) queryParams.filter = JSON.stringify(params.filter);

      const response = await axios.get(API_ENDPOINTS.ticket, {
        params: queryParams,
      });
      return response.data;
    } catch (error) {
      console.error("Fetch tickets error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tickets"
      );
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  "tickets/fetchTicketById",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ticket}/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error("Fetch ticket by ID error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ticket"
      );
    }
  }
);

export const createNewTicket = createAsyncThunk(
  "tickets/createNewTicket",
  async (ticketData, { rejectWithValue }) => {
    try {
      // Check if we have attachments to determine if we need FormData
      const hasAttachments =
        ticketData.attachments && ticketData.attachments.length > 0;

      if (hasAttachments) {
        // Use FormData for file uploads
        const formData = new FormData();

        // Append all fields except attachments
        Object.keys(ticketData).forEach((key) => {
          if (
            key !== "attachments" &&
            ticketData[key] !== null &&
            ticketData[key] !== undefined
          ) {
            formData.append(key, ticketData[key]);
          }
        });

        // Append multiple files with 'attachments' field name
        ticketData.attachments.forEach((file) => {
          formData.append("attachments", file);
        });

        const response = await axios.post(API_ENDPOINTS.ticket, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } else {
        // Send as JSON if no attachments
        const { attachments, ...cleanData } = ticketData; // Remove empty attachments array
        const response = await axios.post(API_ENDPOINTS.ticket, cleanData, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.data;
      }
    } catch (error) {
      console.error("Create ticket error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to create ticket"
      );
    }
  }
);

export const updateTicketById = createAsyncThunk(
  "tickets/updateTicketById",
  async ({ ticketId, ticketData }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(ticketData).forEach((key) => {
        if (key === "picture" && ticketData[key]) {
          formData.append("picture", ticketData[key]);
        } else {
          formData.append(key, ticketData[key]);
        }
      });

      const response = await axios.put(
        `${API_ENDPOINTS.ticket}/${ticketId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Update ticket error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update ticket"
      );
    }
  }
);

export const updateTicketStatusAPI = createAsyncThunk(
  "tickets/updateTicketStatusAPI",
  async ({ ticketId, status }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.ticket}/status/${ticketId}`,
        {
          status,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Update ticket status error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update ticket status"
      );
    }
  }
);

export const deleteTicketById = createAsyncThunk(
  "tickets/deleteTicketById",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_ENDPOINTS.ticket}/${ticketId}`
      );
      return { ticketId, ...response.data };
    } catch (error) {
      console.error("Delete ticket error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete ticket"
      );
    }
  }
);

//Ticket status / milestone related thunks can be added here

export const updateMilestone = createAsyncThunk(
  "tickets/updateMilestone",
  async ({ ticketId, milestoneData }, { rejectWithValue }) => {
    try {
      // Handle milestone transition
      if (milestoneData.action === "transition" && milestoneData.targetStage) {
        const formData = new FormData();
        formData.append("targetStage", milestoneData.targetStage);
        if (milestoneData.notes) {
          formData.append("notes", milestoneData.notes);
        }
        if (milestoneData.attachments && milestoneData.attachments.length > 0) {
          milestoneData.attachments.forEach((file) => {
            formData.append("photos", file);
          });
        }

        const response = await axios.post(
          `${API_ENDPOINTS.milestone}/ticket/${ticketId}/transition`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      }

      // Handle adding photos to current milestone
      if (milestoneData.action === "add_photos" && milestoneData.attachments) {
        const formData = new FormData();
        milestoneData.attachments.forEach((file) => {
          formData.append("photos", file);
        });

        const response = await axios.post(
          `${API_ENDPOINTS.milestone}/ticket/${ticketId}/add-photos`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      }

      // Handle generic milestone updates (requires milestoneId)
      const hasAttachments =
        milestoneData.attachments && milestoneData.attachments.length > 0;

      if (hasAttachments) {
        // Use FormData for file uploads
        const formData = new FormData();
        milestoneData.attachments.forEach((file) => {
          formData.append("attachments", file);
        });

        const response = await axios.put(
          `${API_ENDPOINTS.milestone}/${milestoneData.milestoneId || ticketId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      } else {
        const response = await axios.put(
          `${API_ENDPOINTS.milestone}/${milestoneData.milestoneId || ticketId}`,
          milestoneData
        );
        return response.data;
      }
    } catch (error) {
      console.error("Update milestone error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update milestone"
      );
    }
  }
);

const ticketSlice = createSlice({
  name: "tickets",
  initialState: initialState.ticket,
  reducers: {
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload;
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
    createTicket: (state, action) => {
      const newTicket = {
        id: Date.now(),
        ticketNumber: `TKT-${String(state.tickets.length + 1).padStart(
          3,
          "0"
        )}`,
        ...action.payload,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        dueDate: action.payload.dueDate || null,
      };
      state.tickets.unshift(newTicket);
    },
    updateTicket: (state, action) => {
      const { id, ...updates } = action.payload;
      const ticketIndex = state.tickets.findIndex((ticket) => ticket.id === id);
      if (ticketIndex !== -1) {
        state.tickets[ticketIndex] = {
          ...state.tickets[ticketIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    deleteTicket: (state, action) => {
      state.tickets = state.tickets.filter(
        (ticket) => ticket.id !== action.payload
      );
    },
    updateTicketStatus: (state, action) => {
      const { id, status } = action.payload;
      const ticketIndex = state.tickets.findIndex((ticket) => ticket.id === id);
      if (ticketIndex !== -1) {
        state.tickets[ticketIndex].status = status;
        state.tickets[ticketIndex].updatedAt = new Date().toISOString();
      }
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSorting: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.sortBy = sortBy;
      state.sortOrder = sortOrder;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDeviceDetails: (state) => {
      state.deviceDetails = null;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeviceDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeviceDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceDetails = action.payload;
      })
      .addCase(fetchDeviceDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = Array.isArray(action.payload.tickets)
          ? action.payload.tickets
          : action.payload.tickets || [];
        state.totalPages = action.payload.totalPages || 0;
        state.currentPage = action.payload.currentPage || 0;
        state.error = null;
        state.statusCount = action.payload.statusCount || {};
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tickets";
        console.error("Failed to fetch tickets:", action.payload);
      })
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
        state.error = null;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch ticket";
      })
      .addCase(createNewTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.unshift(action.payload);
        state.error = null;
      })
      .addCase(createNewTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create ticket";
      })
      .addCase(updateTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicketById.fulfilled, (state, action) => {
        state.loading = false;
        const ticketIndex = state.tickets.findIndex(
          (ticket) => ticket.id === action.payload.id
        );
        if (ticketIndex !== -1) {
          state.tickets[ticketIndex] = action.payload;
        }
        if (state.currentTicket?.id === action.payload.id) {
          state.currentTicket = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update ticket";
      })
      .addCase(updateTicketStatusAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicketStatusAPI.fulfilled, (state, action) => {
        state.loading = false;
        const ticketIndex = state.tickets.findIndex(
          (ticket) => ticket.id === action.payload.id
        );
        if (ticketIndex !== -1) {
          state.tickets[ticketIndex] = action.payload;
        }
        if (state.currentTicket?.id === action.payload.id) {
          state.currentTicket = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTicketStatusAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update ticket status";
      })
      .addCase(deleteTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTicketById.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = state.tickets.filter(
          (ticket) => ticket.id !== action.payload.ticketId
        );
        if (state.currentTicket?.id === action.payload.ticketId) {
          state.currentTicket = null;
        }
        state.error = null;
      })
      .addCase(deleteTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete ticket";
      });
  },
});

export const {
  setCurrentTicket,
  clearCurrentTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  setFilters,
  setSorting,
  clearError,
  clearDeviceDetails,
  setCurrentPage,
} = ticketSlice.actions;

export default ticketSlice.reducer;
