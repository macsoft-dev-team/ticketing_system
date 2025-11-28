import { useState, useCallback } from 'react';
import axios from '../services/apiInterceptor';
import { useToast } from '../../components/ui/toast';

const API_URL = import.meta.env.VITE_API_URL;

export const useBatch = () => {
  const [currentBatch, setCurrentBatch] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const toastContext = useToast();
  const addToast = toastContext?.addToast || ((toast) => {
    console.warn('Toast not available:', toast);
  });

  // Get all batches for the current user
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/batch`);
      setBatches(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch batches';
      setError(errorMessage);
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Get active batch for the current user
  const fetchActiveBatch = useCallback(async (batchType = null) => {
    setLoading(true);
    setError(null);
    try {
      const url = batchType 
        ? `${API_URL}/batch/active?batchType=${batchType}` 
        : `${API_URL}/batch/active`;
      const response = await axios.get(url);
      setCurrentBatch(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch active batch';
      setError(errorMessage);
      // Don't show toast for 404 errors (no active batch found)
      if (err.response?.status !== 404) {
        addToast({
          title: 'Error',
          description: errorMessage,
          variant: 'error'
        });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Get completed batches for the current user
  const fetchCompletedBatches = useCallback(async (batchType = null) => {
    setLoading(true);
    setError(null);
    try {
      const url = batchType 
        ? `${API_URL}/batch/completed?batchType=${batchType}` 
        : `${API_URL}/batch/completed`;
      const response = await axios.get(url);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch completed batches';
      setError(errorMessage);
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Get or create active batch
  const getOrCreateActiveBatch = useCallback(async (batchType = 'RECEIVE_CONTROLLER') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/batch/get-or-create`, {
        batchType
      });
      setCurrentBatch(response.data);
      addToast({
        title: 'Batch Ready',
        description: `Batch ${response.data.batchCode} is ready`,
        variant: 'success'
      });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to get or create batch';
      setError(errorMessage);
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Create new batch
  const createBatch = useCallback(async (batchType = 'RECEIVE_CONTROLLER') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/batch`, {
        batchType
      });
      setCurrentBatch(response.data);
      addToast({
        title: 'Batch Created',
        description: `New batch ${response.data.batchCode} created`,
        variant: 'success'
      });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create batch';
      setError(errorMessage);
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Add ticket to batch
  const addTicketToBatch = useCallback(async (batchId, ticketId) => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/batch/add-ticket`, {
        batchId,
        ticketId
      });
      
      // Update current batch if it's the same batch
      if (currentBatch && currentBatch.id === batchId) {
        setCurrentBatch(prev => ({
          ...prev,
          batchItems: [...(prev.batchItems || []), response.data]
        }));
      }
      
      addToast({
        title: 'Ticket Added',
        description: `Ticket ${response.data.ticket.ticketCode} added to batch`,
        variant: 'success'
      });
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add ticket to batch';
      setError(errorMessage);
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      });
      throw err;
    }
  }, [currentBatch, addToast]);

  // Remove ticket from batch
  const removeTicketFromBatch = useCallback(async (batchId, ticketId) => {
    setError(null);
    try {
      await axios.delete(`${API_URL}/batch/remove-ticket`, {
        data: { batchId, ticketId }
      });
      
      // Update current batch if it's the same batch
      if (currentBatch && currentBatch.id === batchId) {
        setCurrentBatch(prev => ({
          ...prev,
          batchItems: prev.batchItems?.filter(item => item.ticket.id !== ticketId) || []
        }));
      }
      
      addToast({
        title: 'Ticket Removed',
        description: 'Ticket removed from batch',
        variant: 'success'
      });
      
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to remove ticket from batch';
      setError(errorMessage);
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      });
      throw err;
    }
  }, [currentBatch, addToast]);

  // Check if ticket is in current batch
  const isTicketInBatch = useCallback((ticketId) => {
    if (!currentBatch?.batchItems) return false;
    return currentBatch.batchItems.some(item => item.ticket.id === ticketId);
  }, [currentBatch]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear current batch
  const clearCurrentBatch = useCallback(() => {
    setCurrentBatch(null);
  }, []);

  return {
    currentBatch,
    batches,
    loading,
    error,
    // Actions
    fetchBatches,
    fetchActiveBatch,
    fetchCompletedBatches,
    getOrCreateActiveBatch,
    createBatch,
    addTicketToBatch,
    removeTicketFromBatch,
    isTicketInBatch,
    clearError,
    clearCurrentBatch,
  };
};

export default useBatch;