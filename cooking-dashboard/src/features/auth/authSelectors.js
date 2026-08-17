import { createSelector } from '@reduxjs/toolkit';

// Base selector
export const selectAuthState = (state) => state.auth;

// Core authentication state
export const selectIsAuthenticated = (state) => Boolean(state.auth?.isAuthenticated);
export const selectAuthLoading = (state) => Boolean(state.auth?.loading);
export const selectAuthError = (state) => state.auth?.error || null;
export const selectAuthToken = (state) => state.auth?.token || null;

// Station (from login form)
export const selectAssignedStation = (state) => state.auth?.station || 'Main Kitchen';


export const selectRestaurantId = (state) => {
  const auth = state.auth || {};

  //  Direct restaurantId (from kitchen login or normalized /me response)
  if (auth.restaurantId) return auth.restaurantId;

  // From staff object (regular admin/staff login)
  if (auth.staff?.restaurantId) return auth.staff.restaurantId;

  // From user object (fallback)
  if (auth.user?.restaurantId) return auth.user.restaurantId;

  // From data object (some /me responses put it here)
  if (auth.data?.restaurantId) return auth.data.restaurantId;

  // If it's a kitchen user and we have the restaurant _id in data
  if (auth.role === 'kitchen' && auth.data?._id) return auth.data._id;

  return null;
};


// User / Staff Data Selectors
export const selectCurrentStaff = (state) => state.auth?.staff || null;
export const selectUser = (state) => state.auth?.staff || state.auth?.user || null; // alias

// Kitchen-specific selector
export const selectIsKitchen = (state) => state.auth?.role === 'kitchen';

// General role selector
export const selectUserRole = (state) => state.auth?.role || state.auth?.staff?.role || null;

// Memoized selectors for performance
export const selectStaffDisplayName = createSelector(
  [selectCurrentStaff, selectUser],
  (staff, user) => staff?.name || user?.name || 'Kitchen Staff'
);

export const selectStaffRole = createSelector(
  [selectUserRole],
  (role) => {
    if (!role) return 'Kitchen Staff';
    return role === 'kitchen' ? 'Kitchen Display' : role.charAt(0).toUpperCase() + role.slice(1);
  }
);

// Combined session info
export const selectSessionSummary = createSelector(
  [selectStaffDisplayName, selectAssignedStation, selectUserRole],
  (name, station, role) => ({
    name,
    station,
    role,
    displayString: `${name} • ${station}`
  })
);

export const selectIsAdmin = createSelector(
  [selectUserRole],
  (role) => {
    if (!role) return false;
    const r = role.toLowerCase();
    return r === 'admin' || r === 'superadmin' || r === 'manager';
  }
);

// Kitchen-specific helpers
export const selectIsKitchenMode = createSelector(
  [selectUserRole],
  (role) => role === 'kitchen'
);

export const selectKitchenRestaurantData = (state) => {
  const auth = state.auth || {};
  return auth.role === 'kitchen' ? auth.data : null;
};

export default {
  selectAuthState,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectAuthToken,
  selectRestaurantId,
  selectAssignedStation,
  selectCurrentStaff,
  selectUser,
  selectUserRole,
  selectStaffDisplayName,
  selectStaffRole,
  selectSessionSummary,
  selectIsAdmin,
  selectIsKitchen,
  selectIsKitchenMode,
  selectKitchenRestaurantData,
};