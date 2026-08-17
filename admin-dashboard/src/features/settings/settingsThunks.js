import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api'; 

/**
 * @desc Fetch all restaurant settings
 * @route GET /api/settings
 */
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/settings');
      return response.data.settings || response.data;
    } catch (err) {
      console.error('Fetch Settings Error:', err);
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load settings from server'
      );
    }
  }
);

/**
 * @desc Update general restaurant settings
 * @route PUT /api/settings
 */
export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await api.put('/settings', settingsData);
      return response.data.settings || response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update settings'
      );
    }
  }
);

/**
 * @desc Change administrative password
 * @route PUT /api/settings/password
 */
export const changePassword = createAsyncThunk(
  'settings/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.put('/settings/password', {
        currentPassword,
        newPassword,
      });
      return response.data.message || 'Password updated successfully';
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Current password incorrect'
      );
    }
  }
);

/**
 * @desc Toggle Two-Factor Authentication
 * @route PATCH /api/settings/2fa
 */
export const toggleTwoFactorAuth = createAsyncThunk(
  'settings/toggle2FA',
  async (enable, { rejectWithValue }) => {
    try {
      const response = await api.patch('/settings/2fa', { enable });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Security update failed'
      );
    }
  }
);

export const updateKitchenPin = createAsyncThunk(
  'settings/updateKitchenPin',
  async ({ currentPin, newPin }, { rejectWithValue }) => {
    try {
      const response = await api.patch('/auth/kitchen/pin', { currentPin, newPin });
      return response.data.message || 'Kitchen PIN updated successfully';
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update kitchen PIN'
      );
    }
  }
);