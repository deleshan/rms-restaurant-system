import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

/**
 * Helper to extract error message for rejectWithValue
 */
const getErrorMessage = (error) => {
  return error.response?.data?.message || error.message || 'An unexpected error occurred';
};

// Fetch customer profile (using phone as identifier)
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (phone, { rejectWithValue }) => {
    try {
      const response = await api.getProfile(phone);
      // Expecting { name, phone, email, etc. }
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Update profile information
// Note: updates should be an object like { name: 'New Name', email: 'new@email.com' }
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ phone, updates }, { rejectWithValue }) => {
    try {
      const response = await api.updateProfile(phone, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Fetch loyalty points & tier
export const fetchLoyalty = createAsyncThunk(
  'profile/fetchLoyalty',
  async (phone, { rejectWithValue }) => {
    try {
      const response = await api.getLoyalty(phone);
      // Expecting { points: 150, tier: 'Loyal' }
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Fetch active offers for this customer
export const fetchActiveOffers = createAsyncThunk(
  'profile/fetchActiveOffers',
  async (phone, { rejectWithValue }) => {
    try {
      const response = await api.getActiveOffers(phone);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);