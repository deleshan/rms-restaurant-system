import axios from 'axios';
import { store } from '../store/store';
import { logoutStaff } from '../features/auth/authSlice';

// Create Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically injects the JWT token from Redux state 
 * into every outgoing request.
 */
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles global error cases like 401 (Token Expired).
 * If the session is invalid, it clears the local state.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response && response.status === 401) {
      store.dispatch(logoutStaff());
    }

    const errorMessage = response?.data?.message || 'A network error occurred';
    return Promise.reject(errorMessage);
  }
);

export default api;