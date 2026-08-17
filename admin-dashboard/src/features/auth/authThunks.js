import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

/**
 * LOGIN THUNK
 * Handles admin/staff login and persists token/user
 */
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/admin', {
        email: email.trim(),
        password,
      });

      const { user, token, message } = response.data;

      // Persistence
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, token, message: message || 'Login successful' };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * LOGOUT THUNK
 * Clears local storage and resets state
 */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return { message: 'Logged out successfully' };
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue('Logout failed');
    }
  }
);

/**
 * FETCH CURRENT USER THUNK
 * Used on app load to verify if the saved token is still valid
 */
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      
      // Update the user object in storage with fresh data from DB
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data.user;
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(
        err.response?.data?.message || 'Session expired. Please login again.'
      );
    }
  }
);

/**
 * UPDATE PROFILE THUNK
 * Updates the 'name', 'email', or 'notes' for the logged-in user
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      // Update local storage so the UI reflects the name change immediately
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update profile'
      );
    }
  }
);

// Grouping exports for cleaner importing in the slice
const authThunks = {
  login,
  logout,
  fetchCurrentUser,
  updateProfile,
};

export default authThunks;