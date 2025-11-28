import axios from './apiInterceptor';
import { API_ENDPOINTS } from '../constants/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The interceptors are already handled in apiInterceptor.js

// Ticket API endpoints
export const ticketAPI = {
  // Create new ticket
  createTicket: async (ticketData) => {
    try {
      // Handle file attachments if any
      if (ticketData.attachments && ticketData.attachments.length > 0) {
        const formData = new FormData();
        
        // Append all form fields
        Object.keys(ticketData).forEach(key => {
          if (key !== 'attachments' && ticketData[key] !== null && ticketData[key] !== undefined) {
            formData.append(key, ticketData[key]);
          }
        });
        
        // Append multiple files with the 'attachments' field name (supports up to 12 files)
        ticketData.attachments.forEach(file => {
          formData.append('attachments', file);
        });
        
        const response = await apiClient.post('/ticket', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        // Send as JSON if no attachments
        const response = await apiClient.post('/ticket', ticketData);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  // Get ticket details by ID
  getTicket: async (ticketId) => {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return response.data;
  },

  // Update ticket status
  updateTicketStatus: async (ticketId, status) => {
    const response = await apiClient.patch(`/tickets/${ticketId}/status`, { status });
    return response.data;
  },

  // Get ticket conversation
  getConversation: async (ticketId) => {
    const response = await apiClient.get(`/tickets/${ticketId}/messages`);
    return response.data;
  },

  // Send message in conversation
  sendMessage: async (ticketId, messageData) => {
    const response = await apiClient.post(`/tickets/${ticketId}/messages`, messageData);
    return response.data;
  },

  // Close conversation
  closeConversation: async (ticketId) => {
    const response = await apiClient.post(`/tickets/${ticketId}/close`);
    return response.data;
  },

  // Upload attachments
  uploadAttachments: async (ticketId, files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('attachments', file);
    });
    
    const response = await apiClient.post(`/tickets/${ticketId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Spare Request API endpoints
export const spareRequestAPI = {
  // Create spare request
  createRequest: async (ticketId, requestData) => {
    const response = await apiClient.post(`/tickets/${ticketId}/spare-requests`, requestData);
    return response.data;
  },

  // Get spare request status
  getRequestStatus: async (requestId) => {
    const response = await apiClient.get(`/spare-requests/${requestId}`);
    return response.data;
  },

  // Update spare request
  updateRequest: async (requestId, updateData) => {
    const response = await apiClient.patch(`/spare-requests/${requestId}`, updateData);
    return response.data;
  },

  // Upload documents for spare request
  uploadDocuments: async (requestId, files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('documents', file);
    });
    
    const response = await apiClient.post(`/spare-requests/${requestId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Product API endpoints
export const productAPI = {
  // Search products
  searchProducts: async (searchQuery, filters = {}) => {
    const params = {
      q: searchQuery,
      ...filters
    };
    const response = await apiClient.get('/products/search', { params });
    return response.data;
  },

  // Get product details
  getProduct: async (productId) => {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  },

  // Check product availability
  checkAvailability: async (productIds) => {
    const response = await apiClient.post('/products/check-availability', { productIds });
    return response.data;
  },

  // Get product categories
  getCategories: async () => {
    const response = await apiClient.get('/products/categories');
    return response.data;
  }
};

// Customer API endpoints
export const customerAPI = {
  // Get customer details
  getCustomer: async (customerId) => {
    const response = await apiClient.get(`/customers/${customerId}`);
    return response.data;
  },

  // Update customer information
  updateCustomer: async (customerId, customerData) => {
    const response = await apiClient.patch(`/customers/${customerId}`, customerData);
    return response.data;
  }
};

// Profile API endpoints
export const profileAPI = {
  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile/update', profileData);
    return response.data;
  }
};

// Controller API endpoints
export const controllerAPI = {
  // Get controller details
  getController: async (controllerId) => {
    const response = await apiClient.get(`/controllers/${controllerId}`);
    return response.data;
  },

  // Update controller information
  updateController: async (controllerId, controllerData) => {
    const response = await apiClient.patch(`/controllers/${controllerId}`, controllerData);
    return response.data;
  },

  // Get controller diagnostics
  getDiagnostics: async (controllerId) => {
    const response = await apiClient.get(`/controllers/${controllerId}/diagnostics`);
    return response.data;
  },

  // Get controller details from LMS by controller number
  getControllerFromLMS: async (controllerNo) => {
    try {
      // Create a separate axios instance for LMS API
      const lmsClient = axios.create({
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Replace :serialnumber placeholder with actual controller number
      const url = API_ENDPOINTS.LMS_BASE_URL.replace(':serialnumber', controllerNo);      
      const response = await lmsClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching controller details from LMS:', error);
      throw error;
    }
  }
};

// WebSocket connection for real-time updates
export const createWebSocketConnection = (ticketId, onMessage, onError) => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
  const socket = new WebSocket(`${wsUrl}/tickets/${ticketId}`);

  socket.onopen = () => {
   };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };

  socket.onclose = (event) => {
   };

  return socket;
};

// Error handling utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      message: data?.message || 'An error occurred',
      status,
      details: data?.details || null
    };
  } else if (error.request) {
    // Request was made but no response
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      details: null
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: null,
      details: null
    };
  }
};

// Project API endpoints
export const projectAPI = {
  // Get all projects (without authentication)
  getProjects: async () => {
    try {
      const response = await apiClient.get('/projectsWA');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }
};

// Mock data service (for development/testing)
export const mockAPI = {
  getTicket: (ticketId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ticketCode: ticketId,
          raisedDate: '2025-10-09',
          status: 'Open',
          description: 'Controller malfunction in POS system requiring immediate attention',
          attachments: [
            { id: 1, name: 'error_log.pdf', size: '2.3 MB', url: '/api/files/error_log.pdf' },
            { id: 2, name: 'system_screenshot.png', size: '1.8 MB', url: '/api/files/screenshot.png' }
          ],
          customer: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1 234 567 8900',
            company: 'Tech Solutions Inc.'
          },
          controller: {
            controllerNo: 'CTRL-8847',
            head: 'Main Terminal',
            imei: '353456789012345',
            hp: '24V DC',
            motorType: 'Stepper Motor SM-200',
            faultCode: 'ERR_COMM_TIMEOUT'
          }
        });
      }, 1000);
    });
  },

  searchProducts: (query) => {
    const products = [
      { id: 1, name: 'Controller Board V2.1', price: 150.00, stock: 25, category: 'Electronics' },
      { id: 2, name: 'Power Supply 24V', price: 80.00, stock: 15, category: 'Power' },
      { id: 3, name: 'Motor Assembly', price: 200.00, stock: 8, category: 'Mechanical' },
      { id: 4, name: 'Communication Module', price: 120.00, stock: 12, category: 'Electronics' },
      { id: 5, name: 'Display Unit LCD', price: 95.00, stock: 20, category: 'Display' }
    ];
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = products.filter(product =>
          product.name.toLowerCase().includes(query.toLowerCase())
        );
        resolve(filtered);
      }, 500);
    });
  },

  createSpareRequest: (requestData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'SR-' + Math.random().toString(36).substr(2, 9),
          status: 'Submitted',
          createdAt: new Date().toISOString(),
          ...requestData
        });
      }, 1000);
    });
  }
};

export default apiClient;