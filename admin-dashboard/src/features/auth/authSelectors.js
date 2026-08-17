import { createSelector } from '@reduxjs/toolkit';

// Base selector - gets the entire auth slice from the store
export const selectAuth = (state) => state.auth;

// Fundamental field selectors
export const selectUser = createSelector(
  [selectAuth],
  (auth) => auth.user
);

export const selectToken = createSelector(
  [selectAuth],
  (auth) => auth.token
);

export const selectIsAuthenticated = createSelector(
  [selectAuth],
  (auth) => auth.isAuthenticated
);

export const selectAuthLoading = createSelector(
  [selectAuth],
  (auth) => auth.loading
);

export const selectAuthError = createSelector(
  [selectAuth],
  (auth) => auth.error
);

// Role-Based Selectors
export const selectCurrentUserRole = createSelector(
  [selectUser],
  (user) => user?.role?.toLowerCase() || 'guest'
);

/**
 * Checks if the user has administrative privileges.
 * Matches: 'admin', 'superadmin', or 'manager'
 */
export const selectIsAdmin = createSelector(
  [selectCurrentUserRole],
  (role) => ['admin', 'superadmin', 'manager'].includes(role)
);

// Identity Selectors 
export const selectUserFullName = createSelector(
  [selectUser],
  (user) => user?.name || 'User'
);

/**
 * Generates initials from the 'name' field.
 * Example: "kapila viraj" -> "KV", "Admin" -> "AD"
 */
export const selectUserInitials = createSelector(
  [selectUserFullName],
  (fullName) => {
    if (!fullName || fullName === 'User') return '??';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }
);

// Contextual Selectors
export const selectRestaurantId = createSelector(
  [selectUser],
  (user) => user?.restaurantId || null
);


export const authSelectors = {
  selectAuth,
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectCurrentUserRole,
  selectIsAdmin,
  selectUserFullName,
  selectUserInitials,
  selectRestaurantId
};

export default authSelectors;