import axios from 'axios';
import { API_URL } from '../constants/api';

// API functions for spare request approval

/**
 * Get pending spare requests for approval
 */
export const getPendingSpareRequests = async (skip = 0, take = 20) => {
  try {
    const response = await axios.get(`${API_URL}/spare-requests/pending-approval`, {
      params: { skip, take },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pending spare requests:', error);
    throw error;
  }
};

/**
 * Approve individual spare request item
 */
export const approveSpareRequestItem = async (itemId) => {
  try {
    const response = await axios.post(`${API_URL}/spare-requests/${itemId}/approve`, {}, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error approving spare request item:', error);
    throw error;
  }
};

/**
 * Reject individual spare request item
 */
export const rejectSpareRequestItem = async (itemId, reason = '') => {
  try {
    const response = await axios.post(`${API_URL}/spare-requests/${itemId}/reject`, {
      reason,
    }, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting spare request item:', error);
    throw error;
  }
};

/**
 * Bulk approve multiple spare request items
 */
export const bulkApproveSpareRequestItems = async (itemIds) => {
  try {
    const response = await axios.post(`${API_URL}/spare-requests/bulk-approve`, {
      itemIds,
    }, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error bulk approving spare request items:', error);
    throw error;
  }
};

/**
 * Get user notifications
 */
export const getNotifications = async () => {
  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.patch(`${API_URL}/notifications/${notificationId}/read`, {}, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Get notification counts
 */
export const getNotificationCounts = async () => {
  try {
    const response = await axios.get(`${API_URL}/notifications/counts`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notification counts:', error);
    throw error;
  }
};