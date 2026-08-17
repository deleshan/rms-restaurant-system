import { createSelector } from '@reduxjs/toolkit';

// Base Selectors (Raw Data)
export const selectOrderState = (state) => state.orders;
export const selectAllOrders = (state) => state.orders.orders;
export const selectOrderHistory = (state) => state.orders.history;
export const selectOrdersLoading = (state) => state.orders.loading;
export const selectOrdersError = (state) => state.orders.error;
export const selectSocketConnected = (state) => state.orders.isConnected;

/**
 * Station Filtered Selector
 * Automatically filters the "Live" feed based on the user's assigned station.
 */
export const selectOrdersByStation = createSelector(
  [selectAllOrders, (state) => state.auth.station],
  (orders, station) => {
    if (!station || station === 'Full Kitchen') {
      return orders;
    }
    return orders.filter((order) => (order.stations || []).includes(station));
  }
);

/**
 * Priority & Sorting Selector
 * Handles the visual order of the KDS:
 * - Sorts by Status: Pending (1) -> Preparing (2) -> Ready (3)
 * - Sorts by Time: Oldest tickets stay at the top.
 */
export const selectPrioritizedOrders = createSelector(
  [selectOrdersByStation],
  (orders) => {
    return [...orders].sort((a, b) => {
      const priority = { 'Pending': 1, 'Preparing': 2, 'Ready': 3 };
      
      // First sort by status priority
      if (priority[a.status] !== priority[b.status]) {
        return priority[a.status] - priority[b.status];
      }
      // If status is the same, oldest (earliest createdAt) comes first
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }
);

/**
 * Order Stats (For Sidebar/Dashboards)
 */
export const selectOrderStats = createSelector(
  [selectOrdersByStation],
  (orders) => {
    return {
      pending: orders.filter(o => o.status === 'Pending').length,
      preparing: orders.filter(o => o.status === 'Preparing').length,
      ready: orders.filter(o => o.status === 'Ready').length,
      total: orders.length
    };
  }
);

/**
 * Urgent Order Selector
 * Used for "Fire" alerts or notification badges.
 */
export const selectUrgentCount = createSelector(
  [selectOrdersByStation],
  (orders) => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60000);
    return orders.filter(o => 
      new Date(o.createdAt) < fifteenMinutesAgo && o.status !== 'Ready'
    ).length;
  }
);

/**
 * History Search Selector
 * Specifically for the OrderHistory component. 
 * Optimized to handle large archives without lagging the UI.
 */
export const selectFilteredHistory = createSelector(
  [selectOrderHistory, (state, searchTerm) => searchTerm],
  (history, searchTerm) => {
    if (!searchTerm) return history;
    
    const term = searchTerm.toLowerCase().trim();
    return history.filter(order => 
      order.tableId?.toString().includes(term) || 
      order._id.toLowerCase().includes(term)
    );
  }
);

export const selectHistoryMeta = (state) => state.orders.historyMeta;

export const selectStationCounts = createSelector(
  [selectAllOrders],
  (orders) => {
    const counts = { 'Hot Station': 0, 'Cold Station': 0, 'Bar / Drinks': 0 };
    orders
      .filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.status))
      .forEach(order => {
        (order.items.station || []).forEach(station => {
          if (counts[station] !== undefined) counts[station] += 1;
        });
      });
    return counts;
  }
);

export const selectAvgPrepTime = createSelector(
  [selectOrderHistory],
  (history) => {
    const withDuration = history.filter(o => typeof o.prepDurationSeconds === 'number');
    if (withDuration.length === 0) return null;
    const avgSeconds = withDuration.reduce((sum, o) => sum + o.prepDurationSeconds, 0) / withDuration.length;
    const mins = Math.floor(avgSeconds / 60);
    const secs = Math.round(avgSeconds % 60);
    return `${mins}m ${secs}s`;
  }
);