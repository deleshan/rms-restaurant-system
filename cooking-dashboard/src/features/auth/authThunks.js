import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

/**
 * Handle Kitchen/Staff Login
 * credentials: { restaurantId, pin, station }
 */
export const loginStaff = createAsyncThunk(
  'auth/loginStaff',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials); 
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Login failed' });
    }
  }
);

/**
 * Verify an existing session on app load
 * This keeps the user logged in after a page refresh.
 */
export const verifySession = createAsyncThunk(
  'auth/verifySession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      
      const payload = response.data;
      
      return {
        ...payload,
        restaurantId: payload.restaurantId || payload.data?.restaurantId || 
                     (payload.role === 'kitchen' ? payload.data?._id : null)
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Session expired');
    }
  }
);