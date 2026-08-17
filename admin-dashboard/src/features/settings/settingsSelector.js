import { createSelector } from '@reduxjs/toolkit';

/**
 * BASE SELECTORS
 * Direct access to the state branches
 */
export const selectSettingsState = (state) => state.settings;

export const selectSettingsData = (state) => state.settings.settings;

/**
 * STATUS SELECTORS
 * Used for UI feedback (loaders, errors, toasts)
 */
export const selectSettingsLoading = createSelector(
  [selectSettingsState],
  (state) => state.loading
);

export const selectSettingsError = createSelector(
  [selectSettingsState],
  (state) => state.error
);

export const selectSettingsSuccess = createSelector(
  [selectSettingsState],
  (state) => state.successMessage
);

export const selectIsSettingsInitialized = createSelector(
  [selectSettingsState],
  (state) => state.isInitialized
);

/* MEMOIZED DATA SELECTORS */

// Restaurant Identity
export const selectRestaurantProfile = createSelector(
  [selectSettingsData],
  (settings) => ({
    name: settings.restaurantName,
    owner: settings.ownerName,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
  })
);

// Localization & UI
export const selectCurrency = createSelector(
  [selectSettingsData],
  (settings) => settings.currency || 'LKR'
);

export const selectTheme = createSelector(
  [selectSettingsData],
  (settings) => settings.theme || 'light'
);

// Notifications Object
export const selectNotificationSettings = createSelector(
  [selectSettingsData],
  (settings) => settings.notifications || { email: true, sms: true, push: false }
);

// Financial Config
export const selectFinancialSettings = createSelector(
  [selectSettingsData],
  (settings) => ({
    taxRate: settings.taxRate || 0,
    serviceCharge: settings.serviceCharge || 0,
  })
);

// Security Status
export const selectTwoFactorStatus = createSelector(
  [selectSettingsData],
  (settings) => settings.twoFactorAuth || false
);


const settingsSelectors = {
  selectSettingsState,
  selectSettingsData,
  selectSettingsLoading,
  selectSettingsError,
  selectSettingsSuccess,
  selectIsSettingsInitialized,
  selectRestaurantProfile,
  selectCurrency,
  selectTheme,
  selectNotificationSettings,
  selectFinancialSettings,
  selectTwoFactorStatus,
};

export default settingsSelectors;