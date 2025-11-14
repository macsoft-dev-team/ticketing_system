/**
 * Extracts a user-friendly error message from various error object structures
 * @param {any} error - The error object, string, or other error format
 * @param {string} fallbackMessage - Default message if no specific error message is found
 * @returns {string} - Extracted or fallback error message
 */
export const extractErrorMessage = (error, fallbackMessage = 'Something went wrong') => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  if (error?.data?.message) {
    return error.data.message;
  }
  
  // Handle nested error structures
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  return fallbackMessage;
};

/**
 * Creates a standardized error handler for Redux async thunks with toast notifications
 * @param {Function} addToast - Toast notification function
 * @param {string} operation - The operation being performed (e.g., 'creating', 'updating', 'deleting')
 * @param {string} entityName - The name of the entity being operated on (e.g., 'template', 'user')
 * @returns {Function} - Error handler function
 */
export const createErrorHandler = (addToast, operation, entityName = 'item') => {
  return (error) => {
    const errorMessage = extractErrorMessage(error, `Something went wrong while ${operation} the ${entityName}.`);
    
    addToast({
      title: `Unable to ${operation.charAt(0).toUpperCase() + operation.slice(1)} ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`,
      description: `Sorry, we couldn't ${operation} your ${entityName}. ${errorMessage}`,
      variant: "destructive"
    });
    
    throw error;
  };
};
