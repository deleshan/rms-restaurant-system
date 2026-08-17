import { createSelector } from '@reduxjs/toolkit';

// Base Selector
const selectOrderStateBase = (state) => state.order || {};

// Primitive Selectors

/**
 * Current active order (Pending, Preparing, Ready)
 */
export const selectCurrentOrder = createSelector(
  [selectOrderStateBase],
  (order) => order.currentOrder || null
);

/**
 * Past/completed orders list
 */
export const selectPastOrders = createSelector(
  [selectOrderStateBase],
  (order) => order.pastOrders || []
);

/**
 * Global loading state
 */
export const selectOrderLoading = createSelector(
  [selectOrderStateBase],
  (order) => !!order.loading
);

/**
 * Global error state
 */
export const selectOrderError = createSelector(
  [selectOrderStateBase],
  (order) => order.error || null
);

/**
 * isPaid flag - triggers review prompt after order completion
 */
export const selectIsPaid = createSelector(
  [selectOrderStateBase],
  (order) => !!order.isPaid
);

// Derived Selectors 

/**
 * Current order status string
 * Returns 'idle' if no active order
 */
export const selectOrderStatus = createSelector(
  [selectCurrentOrder],
  (current) => current?.status || 'idle'
);

/**
 * Current order ID
 * Used for socket room joins and API calls
 */
export const selectCurrentOrderId = createSelector(
  [selectCurrentOrder],
  (current) => current?._id || null
);

/**
 * Current order table ID
 */
export const selectCurrentOrderTableId = createSelector(
  [selectCurrentOrder],
  (current) => current?.tableId || null
);

/**
 * Current order items array
 */
export const selectCurrentOrderItems = createSelector(
  [selectCurrentOrder],
  (current) => current?.items || []
);

/**
 * Current order total amount
 * Handles both totalPrice and totalAmount field names for safety
 */
export const selectCurrentOrderTotal = createSelector(
  [selectCurrentOrder],
  (current) => current?.totalPrice || current?.totalAmount || 0
);

/**
 * Check if an order is currently active
 * (not Completed, Cancelled, or idle)
 */
export const selectIsOrderActive = createSelector(
  [selectOrderStatus],
  (status) => ['Pending', 'Preparing', 'Ready'].includes(status)
);

/**
 * Check if the order is in the kitchen (Preparing or Ready)
 */
export const selectIsOrderInKitchen = createSelector(
  [selectOrderStatus],
  (status) => ['Preparing', 'Ready'].includes(status)
);

/**
 * Check if bill has been requested
 */
export const selectBillRequested = createSelector(
  [selectCurrentOrder],
  (current) => !!current?.billRequested
);

/**
 * Total number of past orders
 * Useful for showing order count badges
 */
export const selectPastOrderCount = createSelector(
  [selectPastOrders],
  (past) => past.length
);

/**
 * Most recent past order
 * Useful for post-order review prompts
 */
export const selectMostRecentPastOrder = createSelector(
  [selectPastOrders],
  (past) => past[0] || null
);

/**
 * Progress step index for the order tracker UI
 * Maps status to a numeric step (0-3)
 */
export const selectOrderProgressStep = createSelector(
  [selectOrderStatus],
  (status) => {
    const steps = {
      Pending:   0,
      Preparing: 1,
      Ready:     2,
      Served:    3,
      Completed: 3,
    };
    return steps[status] ?? 0;
  }
);

// Combined Selectors 

/**
 * Combined selector for OrdersPage.jsx
 * Prevents multiple useSelector calls and reduces re-renders
 */
export const selectOrderState = createSelector(
  [selectCurrentOrder, selectPastOrders, selectOrderLoading, selectOrderError],
  (current, past, loading, error) => ({
    current,
    past,
    loading,
    error,
  })
);

/**
 * Combined selector for the order status tracker UI
 * Everything the progress bar and status badge needs in one call
 */
export const selectOrderTrackerState = createSelector(
  [selectCurrentOrder, selectOrderStatus, selectOrderProgressStep, selectIsOrderActive],
  (current, status, step, isActive) => ({
    current,
    status,
    step,
    isActive,
  })
);

/**
 * Combined selector for the cart/checkout flow
 * Tells checkout whether to block placing a new order
 */
export const selectOrderCheckoutState = createSelector(
  [selectIsOrderActive, selectOrderLoading, selectOrderError, selectCurrentOrderId],
  (isActive, loading, error, orderId) => ({
    isActive,
    loading,
    error,
    orderId,
  })
);

/**
 * Combined selector for the review/payment flow
 */
export const selectReviewFlowState = createSelector(
  [selectOrderStateBase],
  (order) => {
    const activeOrderData = order.currentOrder || order.pastOrders[0] || null;

    return {
      isPaid: order.isPaid,
      // Provide the order ID
      currentOrderId: order.currentOrder?._id || order.lastOrderId || (order.pastOrders[0]?._id), 
      // PROVIDE THE FULL ORDER OBJECT (This contains the .items array)
      currentOrder: activeOrderData, 
      lastOrder: order.pastOrders[0] || null,
    };
  }
);