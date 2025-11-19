/**
 * Creates a debounced function that delays invoking the provided function
 * until after wait milliseconds have elapsed since the last time the
 * debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} immediate - Whether to trigger the function on the leading edge
 * @returns {Function} The debounced function
 */
export const debounce = (func, wait = 300, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
};

/**
 * Creates a debounced function specifically for search input
 * with a default wait time of 500ms
 * 
 * @param {Function} searchFunction - The search function to debounce
 * @param {number} wait - The number of milliseconds to delay (default: 500)
 * @returns {Function} The debounced search function
 */
export const debounceSearch = (searchFunction, wait = 500) => {
  return debounce(searchFunction, wait);
};

/**
 * Creates a debounced function for API calls with a default wait time of 300ms
 * 
 * @param {Function} apiFunction - The API function to debounce
 * @param {number} wait - The number of milliseconds to delay (default: 300)
 * @returns {Function} The debounced API function
 */
export const debounceApiCall = (apiFunction, wait = 300) => {
  return debounce(apiFunction, wait);
};

export default debounce;