/**
 * Utility functions for handling device status formatting
 */

/**
 * Converts numeric status to human-readable format
 * @param {number|string} status - The status value (0, 1, or string)
 * @returns {string} - Formatted status text
 */
export const formatStatus = (status) => {
  // Handle numeric status
  if (typeof status === 'number') {
    switch (status) {
      case 0:
        return 'Offline';
      case 1:
        return 'Online';
      case 2:
        return 'Fault';
      default:
        return 'Unknown';
    }
  }
  
  // Handle string status
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'fault':
        return 'Fault';
      default:
        return status;
    }
  }
  
  // Handle null/undefined
  if (status === null || status === undefined) {
    return 'Unknown';
  }
  
  return String(status);
};

/**
 * Gets status configuration for styling purposes
 * @param {number|string} status - The status value
 * @returns {object} - Object with color classes and label
 */
export const getStatusConfig = (status) => {
  const formattedStatus = formatStatus(status);
  
  switch (formattedStatus.toLowerCase()) {
    case 'online':
      return { 
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', 
        label: 'ONLINE',
        badgeColor: 'bg-green-500'
      };
    case 'offline':
      return { 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', 
        label: 'OFFLINE',
        badgeColor: 'bg-gray-500'
      };
    case 'fault':
      return { 
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', 
        label: 'FAULT',
        badgeColor: 'bg-red-500'
      };
    default:
      return { 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 
        label: formattedStatus.toUpperCase(),
        badgeColor: 'bg-blue-500'
      };
  }
};
