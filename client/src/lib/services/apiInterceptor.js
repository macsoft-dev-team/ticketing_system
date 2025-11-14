import axios from 'axios';
import { logout } from '../features/authSlice';

let store;

// This function will be called to set the store reference
export const setStoreForInterceptor = (storeInstance) => {
  store = storeInstance;
};

// Request interceptor to add token to requests
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    console.log('🔐 API Interceptor - Token check:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
      url: config.url,
      method: config.method
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header set');
    } else {
      console.warn('❌ No token found in sessionStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle expired tokens
axios.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('🔒 Unauthorized access - clearing session');
      // Token is expired or invalid
      if (store) {
        store.dispatch(logout());
      }
      // Clear storage
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;