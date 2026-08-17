import { createSlice } from '@reduxjs/toolkit';
import {
  fetchSettings,
} from './settingsThunks';

// Helper to safely load from localStorage
const loadSettings = () => {
  try {
    const serializedSettings = localStorage.getItem('kds_settings');
    if (serializedSettings === null) {
      return {
        fontSize: 'medium',
        audioAlerts: true,
        autoArchive: true,
        refreshInterval: 30,
        compactMode: false,
      };
    }
    return JSON.parse(serializedSettings);
  } catch (err) {
    return {
      fontSize: 'medium',
      audioAlerts: true,
      autoArchive: true,
      refreshInterval: 30,
      compactMode: false,
    };
  }
};

const initialState = {
  ...loadSettings(),
  settings: {
    restaurantName: ''},
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Individual preference updates
    updateFontSize: (state, action) => {
      state.fontSize = action.payload;
      localStorage.setItem('kds_settings', JSON.stringify(state));
    },
    
    toggleAudio: (state) => {
      state.audioAlerts = !state.audioAlerts;
      localStorage.setItem('kds_settings', JSON.stringify(state));
    },
    
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode;
      localStorage.setItem('kds_settings', JSON.stringify(state));
    },

    // Generic updater for any key-value pair
    updatePreference: (state, action) => {
      const { key, value } = action.payload;
      if (key in state) {
        state[key] = value;
        localStorage.setItem('kds_settings', JSON.stringify(state));
      }
    },

    // Bulk update (useful after a cloud sync)
    syncSettings: (state, action) => {
      return {
        ...state,
        ...action.payload,
        status: 'succeeded'
      };
    },

    resetSettings: (state) => {
      const defaults = {
        fontSize: 'medium',
        audioAlerts: true,
        autoArchive: true,
        refreshInterval: 30,
        compactMode: false,
      };
      Object.assign(state, defaults);
      localStorage.setItem('kds_settings', JSON.stringify(defaults));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.settings = action.payload; // this is what was missing
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { 
  updateFontSize, 
  toggleAudio, 
  toggleCompactMode, 
  updatePreference,
  syncSettings,
  resetSettings 
} = settingsSlice.actions;

export default settingsSlice.reducer;