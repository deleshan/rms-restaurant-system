import { createSelector } from '@reduxjs/toolkit';

// Select entire auth state
export const selectAuth = (state) => state.auth;

// Select Table ID
export const selectTableId = createSelector(
  [selectAuth],
  (auth) => auth.tableId
);

// Select Restaurant ID
export const selectRestaurantId = createSelector(
  [selectAuth],
  (auth) => auth.restaurantId
);

/**
 * Select the customer object
 * Fixed: Since authSlice is now flat, we construct the object here
 * so that CartPage and other components get the format they expect.
 */
export const selectCustomer = createSelector(
  [selectAuth],
  (auth) => {
    // If phone is missing, we treat the customer as not identified
    if (!auth.phone) return null;
    
    return {
      name: auth.name,
      phone: auth.phone,
      email: auth.email,
      dateOfBirth: auth.dateOfBirth,
      address: auth.address
    };
  }
);

// Select specific customer details (safely)
export const selectCustomerDetails = createSelector(
  [selectAuth],
  (auth) => ({
    name: auth.name || '',
    phone: auth.phone || '',
    email: auth.email || '',
  })
);

// Check Authentication
export const selectIsAuthenticated = createSelector(
  [selectAuth],
  (auth) => !!auth.phone && auth.isAuthenticated
);

// Loading and Error states
export const selectAuthLoading = createSelector(
  [selectAuth],
  (auth) => auth.loading
);

export const selectAuthError = createSelector(
  [selectAuth],
  (auth) => auth.error
);

/**
 * Combined selector: is user authenticated and has context
 * Ensures we have the user, the table, and the restaurant ID
 */
export const selectIsReadyForMenu = createSelector(
  [selectIsAuthenticated, selectTableId, selectRestaurantId],
  (isAuth, tableId, restaurantId) => isAuth && !!tableId && !!restaurantId
);