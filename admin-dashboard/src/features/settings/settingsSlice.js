import { createSlice } from '@reduxjs/toolkit';
import {
  fetchSettings,
  updateSettings,
  changePassword,
  toggleTwoFactorAuth
} from './settingsThunks';

const initialState = {
  settings: {
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    currency: 'LKR',
    theme: 'light',
    notifications: {
      email: true,
      sms: true,
      push: false,
    },
    twoFactorAuth: false,
    taxRate: 10,
    serviceCharge: 10,
  },
  loading: false,
  error: null,
  successMessage: null,
  isInitialized: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Clear alerts after they are displayed to the user
    clearSettingsError: (state) => {
      state.error = null;
    },
    clearSettingsSuccess: (state) => {
      state.successMessage = null;
    },
    updateLocalTheme: (state, action) => {
      state.settings.theme = action.payload;
    },
    resetSettingsState: () => initialState,
  },
  extraReducers: (builder) => {
    const setPending = (state) => {
      state.loading = true;
      state.error = null;
    };

    const setRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || 'An unexpected error occurred';
    };

    builder
      // Fetch Settings
      .addCase(fetchSettings.pending, setPending)
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = { ...state.settings, ...action.payload };
        state.isInitialized = true;
      })
      .addCase(fetchSettings.rejected, setRejected)

      // Update Settings
      .addCase(updateSettings.pending, setPending)
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = { 
          ...state.settings, 
          ...action.payload,
          notifications: {
            ...state.settings.notifications,
            ...(action.payload.notifications || {})
          }
        };
        state.successMessage = 'Settings saved successfully';
      })
      .addCase(updateSettings.rejected, setRejected)

      // Change Password
      .addCase(changePassword.pending, setPending)
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(changePassword.rejected, setRejected)

      // Toggle 2FA
      .addCase(toggleTwoFactorAuth.pending, setPending)
      .addCase(toggleTwoFactorAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.settings.twoFactorAuth = action.payload.enable;
        state.successMessage = `2FA ${action.payload.enable ? 'enabled' : 'disabled'}`;
      })
      .addCase(toggleTwoFactorAuth.rejected, setRejected);
  },
});


export const {
  clearSettingsError,
  clearSettingsSuccess,
  updateLocalTheme,
  resetSettingsState,
} = settingsSlice.actions;



export * from './settingsThunks'; 
export default settingsSlice.reducer;