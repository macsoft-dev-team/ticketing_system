export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const APP_TITLE = import.meta.env.VITE_APP_TITLE;

export const API_ENDPOINTS = {
  login: `${API_URL}/auth/login`,
  register: `${API_URL}/auth/register`,
  logout: `${API_URL}/auth/logout`,
  upload: `${API_URL}/uploads`,
  ticket: `${API_URL}/tickets`,
  user: `${API_URL}/users`,
  dashboard: `${API_URL}/dashboard`,
  notifications: `${API_URL}/notifications`,
  organisation: `${API_URL}/organisations`,
  serviceCenter: `${API_URL}/service-centers`,
  spareRequest: `${API_URL}/spare-requests`,
  inventory: `${API_URL}/inventory`,
  product: `${API_URL}/products`,
  serviceCenterAssignment: `${API_URL}/service-center-assignment`,
  conversation: `${API_URL}/conversations`,
  milestone: `${API_URL}/milestones`,
  states: `${API_URL}/states`,
  project: `${API_URL}/projects`,
  LMS_BASE_URL: import.meta.env.VITE_LMS_BASE_URL,
};
