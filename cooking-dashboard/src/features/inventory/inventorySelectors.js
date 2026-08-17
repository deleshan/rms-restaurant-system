import { createSelector } from '@reduxjs/toolkit';

// Base Selectors
 
export const selectInventoryState = (state) => state.inventory;
export const selectAllInventoryItems = (state) => state.inventory.items;
export const selectInventoryLoading = (state) => state.inventory.loading;
export const selectInventoryError = (state) => state.inventory.error;
export const selectIsUpdatingInventory = (state) => state.inventory.isUpdating;

/**
 * The "86-List" Selector
 * Returns only items that are currently marked as unavailable.
 * Optimized for the InventoryDrawer.
 */
export const select86List = createSelector(
  [selectAllInventoryItems],
  (items) => items.filter(item => !item.isAvailable)
);

/**
 * Low Stock Selector
 * Returns items that are available but have a stock level below 10.
 * Useful for "Warning" UI states before an item is fully 86-ed.
 */
export const selectLowStockItems = createSelector(
  [selectAllInventoryItems],
  (items) => items.filter(item => item.currentStock > 0 && item.currentStock <= item.minimumStock)
);

/**
 * Category Selector
 * Returns a unique list of categories found in the current inventory.
 */
export const selectInventoryCategories = createSelector(
  [selectAllInventoryItems],
  (items) => {
    const categories = items.map(item => item.category);
    return ['All', ...new Set(categories)];
  }
);

/**
 * Grouped by Category Selector
 * Organizes the inventory into an object keyed by category name.
 * Example: { "Mains": [...], "Sides": [...] }
 */
export const selectInventoryByCategory = createSelector(
  [selectAllInventoryItems],
  (items) => {
    return items.reduce((acc, item) => {
      const { category } = item;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }
);

/**
 * nventory Health Stats
 * Returns a summary of the current stock status for dashboard widgets.
 */
export const selectInventoryStats = createSelector(
  [selectAllInventoryItems, select86List, selectLowStockItems],
  (all, outOfStock, lowStock) => ({
    totalCount: all.length,
    outOfStockCount: outOfStock.length,
    lowStockCount: lowStock.length,
    isHealthy: outOfStock.length === 0 && lowStock.length === 0
  })
);

// Out of stock = zero (or below) currentStock
export const selectOutOfStockItems = createSelector(
  [selectAllInventoryItems],
  (items) => items.filter(item => item.currentStock <= 0)
);

// Low stock = above zero but at/under the item's own minimumStock


// Healthy = everything else
export const selectHealthyStockItems = createSelector(
  [selectAllInventoryItems],
  (items) => items.filter(item => item.currentStock > item.minimumStock)
);