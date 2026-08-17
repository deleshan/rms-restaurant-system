import { createSelector } from '@reduxjs/toolkit';

// Base selector - Safely access the profile slice
const selectProfileStateBase = (state) => state.profile || {};

// Full profile object with safe defaults
export const selectProfileData = createSelector(
  selectProfileStateBase,
  (state) => state.profile || {
    name: '',
    phone: '',
    email: '',
    dateOfBirth: null,
    address: '',
  }
);

// Individual fields with string fallbacks to prevent .trim() or .toLowerCase() crashes
export const selectCustomerName = createSelector(
  selectProfileData,
  (profile) => profile.name || ''
);

export const selectCustomerPhone = createSelector(
  selectProfileData,
  (profile) => profile.phone || ''
);

export const selectLoyaltyPoints = createSelector(
  selectProfileStateBase,
  (state) => state.loyaltyPoints || 0
);

export const selectLoyaltyTier = createSelector(
  selectProfileStateBase,
  (state) => state.tier || 'Regular'
);

export const selectActiveOffers = createSelector(
  selectProfileStateBase,
  (state) => state.activeOffers || []
);

// Loading & error states
export const selectProfileLoading = createSelector(
  selectProfileStateBase,
  (state) => !!state.loading
);

export const selectProfileError = createSelector(
  selectProfileStateBase,
  (state) => state.error || null
);

/**
 * Combined selector for ProfilePage
 */
export const selectProfileState = createSelector(
  [
    selectProfileData,
    selectLoyaltyPoints,
    selectLoyaltyTier,
    selectActiveOffers,
    selectProfileLoading,
    selectProfileError
  ],
  (profile, points, tier, offers, loading, error) => ({
    profile,
    points,
    tier,
    offers,
    loading,
    error,
  })
);