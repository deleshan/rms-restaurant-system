import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api'; 
import { syncSettings } from './settingsSlice';

/**
 * Save User Preferences to the Cloud
 * Syncs the local Redux state (fontSize, station, etc.) to the staff profile.
 */
export const saveUserPreferences = createAsyncThunk(
  'settings/saveToCloud',
  async (preferences, { rejectWithValue }) => {
    try {
      // Logic: PATCH /api/staff/preferences
      const response = await api.patch('/staff/preferences', { preferences });
      
      // Returns the updated preference object from the DB
      return response.data.preferences;
    } catch (err) {
      const message = err.response?.data?.message || 'Cloud sync failed.';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch Global Kitchen Config
 * Gets system-wide settings like "Urgent" time thresholds or station lists.
 */
export const fetchSystemConfig = createAsyncThunk(
  'settings/fetchConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/system/config');
      return response.data.config;
    } catch (err) {
      return rejectWithValue('Failed to load system configurations.');
    }
  }
);

/**
 * Register Terminal
 * Informs the server that this specific browser/tablet is an active KDS.
 * Useful for targeted Socket.io broadcasts.
 */
export const registerTerminal = createAsyncThunk(
  'settings/registerTerminal',
  async (terminalInfo, { rejectWithValue }) => {
    try {
      const response = await api.post('/system/register-terminal', { 
        terminalId: terminalInfo.id || 'KDS-DEFAULT',
        type: 'KDS_TABLET',
        userAgent: navigator.userAgent
      });
      return response.data;
    } catch (err) {
      return rejectWithValue('Terminal registration failed.');
    }
  }
);

/**
 * Initialize Settings on Login
 * Orchestrator thunk to pull everything together when a chef starts their shift.
 */
export const initializeSettings = createAsyncThunk(
  'settings/initialize',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Get system-wide rules (like what defines a 'late' order)
      const configAction = await dispatch(fetchSystemConfig());
      
      // You could also fetch user-specific saved preferences here
      const response = await api.get('/staff/me/preferences');
      if (response.data.preferences) {
        dispatch(syncSettings(response.data.preferences));
      }

      return { config: configAction.payload, preferences: response.data.preferences };
    } catch (err) {
      return rejectWithValue('Initialization failed.');
    }
  }
);

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