import { createSelector } from '@reduxjs/toolkit';

// Base selector
const selectCart = (state) => state.cart;

// Set all cart items (with fallback to empty array)
export const selectCartItems = createSelector(
  [selectCart],
  (cart) => cart?.items || []
);

// Get total amount (ensures it's always a number)
export const selectCartTotal = createSelector(
  [selectCart],
  (cart) => cart?.total || 0
);

// Get total item count (useful for the red badge on the cart icon)
export const selectCartItemCount = createSelector(
  [selectCartItems], // Derived from items to ensure accuracy
  (items) => items.reduce((sum, item) => sum + item.qty, 0)
);

// Get special request string
export const selectSpecialRequest = createSelector(
  [selectCart],
  (cart) => cart?.specialRequest || ''
);

// Check if cart is empty
export const selectIsCartEmpty = createSelector(
  [selectCartItemCount],
  (count) => count === 0
);

/**
 * Get cart summary for order submission
 * This combines everything needed for the handlePlaceOrder function
 */
export const selectCartSummary = createSelector(
  [selectCartItems, selectCartTotal, selectSpecialRequest],
  (items, total, specialRequest) => ({
    items,
    total,
    specialRequest,
  })
);