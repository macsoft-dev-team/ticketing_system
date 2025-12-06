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
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to fetch tickets";
      return rejectWithValue(errorMessage);
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
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to fetch ticket";
      return rejectWithValue(errorMessage);
    }
  }
);

export const searchTickets = createAsyncThunk(
  "tickets/searchTickets",
  async (keyword, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ticket}/search`, {
        params: { keyword }
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to search tickets";
      return rejectWithValue(errorMessage);
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
      // Try to get the most specific error message available
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to create ticket";
      return rejectWithValue(errorMessage);
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
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to update ticket";
      return rejectWithValue(errorMessage);
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
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to update ticket status";
      return rejectWithValue(errorMessage);
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
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to delete ticket";
      return rejectWithValue(errorMessage);
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
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to update milestone";
      return rejectWithValue(errorMessage);
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
    updateTicketLastMessage: (state, action) => {
      const { ticketId, messageData, ticketUpdates = {} } = action.payload;
      const ticketIndex = state.tickets.findIndex((ticket) => ticket.id === ticketId);
      if (ticketIndex !== -1) {
        // Initialize messages array if it doesn't exist
        if (!state.tickets[ticketIndex].messages) {
          state.tickets[ticketIndex].messages = [];
        }
        
        // Check if message already exists
        const existingMessageIndex = state.tickets[ticketIndex].messages.findIndex(
          (msg) => msg.id === messageData.id
        );
        
        if (existingMessageIndex !== -1) {
          // Update existing message
          state.tickets[ticketIndex].messages[existingMessageIndex] = messageData;
        } else {
          // Add new message
          state.tickets[ticketIndex].messages.push(messageData);
        }
        
        // Sort messages by createdAt to ensure proper order
        state.tickets[ticketIndex].messages.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        // Update ticket-level properties
        state.tickets[ticketIndex].updatedAt = messageData.createdAt;
        
        // Apply any additional ticket updates
        Object.assign(state.tickets[ticketIndex], ticketUpdates);
        
        // Move ticket to top of list if it's not already (for better UX)
        if (ticketIndex > 0) {
          const updatedTicket = state.tickets[ticketIndex];
          state.tickets.splice(ticketIndex, 1);
          state.tickets.unshift(updatedTicket);
        }
      }
    },
    addNewTicketFromSocket: (state, action) => {
      const newTicket = action.payload;
      // Check if ticket already exists to avoid duplicates
      const existingIndex = state.tickets.findIndex((ticket) => ticket.id === newTicket.id);
      
      if (existingIndex === -1) {
        // Add new ticket to the beginning of the list
        state.tickets.unshift({
          ...newTicket,
          isNewTicket: true, // Flag for highlighting
          addedAt: new Date().toISOString()
        });
        
        // Update status count if available
        if (state.statusCount && newTicket.status) {
          const statusKey = newTicket.status.toUpperCase();
          if (state.statusCount[statusKey] !== undefined) {
            state.statusCount[statusKey]++;
          }
          if (state.statusCount.ALL !== undefined) {
            state.statusCount.ALL++;
          }
        }
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
      })
      .addCase(searchTickets.pending, (state) => {
        state.searching = true;
        state.error = null;
      })
      .addCase(searchTickets.fulfilled, (state, action) => {
        state.searching = false;
        state.searchResults = Array.isArray(action.payload.tickets)
          ? action.payload.tickets
          : [];
        state.error = null;
      })
      .addCase(searchTickets.rejected, (state, action) => {
        state.searching = false;
        state.searchResults = [];
        state.error = action.payload || "Failed to search tickets";
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
  updateTicketLastMessage,
  addNewTicketFromSocket,
  setFilters,
  setSorting,
  clearError,
  clearDeviceDetails,
  setCurrentPage,
} = ticketSlice.actions;

export default ticketSlice.reducer;
