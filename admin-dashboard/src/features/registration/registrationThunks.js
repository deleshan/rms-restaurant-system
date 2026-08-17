import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

//REGISTER BUSINESS THUNK
export const registerBusiness = createAsyncThunk(
  'registration/registerBusiness',
  async (registrationData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register-business', registrationData);

      const { user, token, message } = response.data;

      if (!token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { 
        user, 
        token, 
        message: message || 'Restaurant registered successfully!' 
      };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
        
      return rejectWithValue(errorMessage);
    }
  }
);

//VALIDATE RESTAURANT NAME
export const checkNameAvailability = createAsyncThunk(
  'registration/checkName',
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.get(`/restaurants/check-name?name=${encodeURIComponent(name)}`);
      return response.data.available; 
    } catch (err) {
      return rejectWithValue('Could not verify name availability');
    }
  }
);

const registrationThunks = {
  registerBusiness,
  checkNameAvailability,
};

export default registrationThunks;