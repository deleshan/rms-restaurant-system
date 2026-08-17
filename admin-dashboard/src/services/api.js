import axios from 'axios';

/**
 * Axios instance configuration
 */
const api = axios.create({
  baseURL: '/api',//import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 * Automatically attaches the JWT token to every outgoing request.
 */
api.interceptors.request.use(
  (config) => {
    // Try to get the raw token first
    let token = localStorage.getItem('token');

    // If 'token' is null, check if it's inside a 'user' or 'userInfo' object
    if (!token) {
      const userData = localStorage.getItem('user') || localStorage.getItem('userInfo');
      if (userData) {
        const parsed = JSON.parse(userData);
        token = parsed.token;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
/**
 * RESPONSE INTERCEPTOR
 * Centralized error handling for expired sessions and server errors.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    // Unauthorized: Token expired or invalid
    if (response && response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      
      if (!window.location.pathname.includes('/login')) {
        // We use window.location because we are outside the React Router context here
        window.location.href = '/login?expired=true';
      }
    }

    // Network Error 
    if (!response) {
      console.error('Network Error: Please check if the backend server is running.');
    }

    // Optional: 403 Forbidden (User is logged in but lacks admin permissions)
    if (response && response.status === 403) {
      console.warn('Access denied: You do not have permission for this action.');
    }

    return Promise.reject(error);
  }
);

export default api;