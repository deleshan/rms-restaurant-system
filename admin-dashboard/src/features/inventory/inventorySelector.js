import { createSelector } from '@reduxjs/toolkit';

// Base Selector
export const selectInventoryState = (state) => state.inventory;

/* DIRECT DATA SELECTORS */
export const selectInventoryItems = createSelector(
  [selectInventoryState],
  (inventory) => inventory.items || []
);

export const selectInventoryLoading = createSelector(
  [selectInventoryState],
  (inventory) => inventory.loading
);

// specifically for the Bulk Upload process
export const selectInventoryUploading = createSelector(
  [selectInventoryState],
  (inventory) => inventory.uploading
);

export const selectInventoryError = createSelector(
  [selectInventoryState],
  (inventory) => inventory.error
);

export const selectInventorySuccessMessage = createSelector(
  [selectInventoryState],
  (inventory) => inventory.successMessage
);

export const selectSelectedInventoryItem = createSelector(
  [selectInventoryState],
  (inventory) => inventory.selectedItem
);

/* SUMMARY / KPI SELECTORS
   These reflect the totals calculated by your backend aggregation */
export const selectLowStockCount = createSelector(
  [selectInventoryState],
  (inventory) => inventory.lowStockCount || 0
);

export const selectOutOfStockCount = createSelector(
  [selectInventoryState],
  (inventory) => inventory.outOfStockCount || 0
);

export const selectExpiringSoonCount = createSelector(
  [selectInventoryState],
  (inventory) => inventory.expiringSoonCount || 0
);

export const selectTotalInventoryValue = createSelector(
  [selectInventoryState],
  (inventory) => inventory.totalStockValue || 0
);

/*DERIVED & FILTERED SELECTORS */

// Memoized Filtered Selector for the Data Table
export const selectFilteredInventory = createSelector(
  [
    selectInventoryItems,
    (state, searchTerm) => searchTerm,
    (state, searchTerm, category) => category,
  ],
  (items, searchTerm, category) => {
    return items.filter((item) => {
      // Search by Name or SKU (matches schema update)
      const matchesSearch = !searchTerm || 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by Category
      const matchesCategory = !category || category === 'all' || item.category === category;
      
      return matchesSearch && matchesCategory;
    });
  }
);

// Specialized Selector for "Restock Needed" list
export const selectItemsNeedingRestock = createSelector(
  [selectInventoryItems],
  (items) => items.filter(item => item.currentStock <= item.minimumStock)
);

// Category Distribution for Recharts/UI Charts
export const selectCategoryDistribution = createSelector(
  [selectInventoryItems],
  (items) => {
    const distribution = {};
    items.forEach(item => {
      const cat = item.category || 'Other';
      distribution[cat] = (distribution[cat] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }
);

export const selectStockMovements = (state) => state.inventory.movements || [];
export const selectMovementsLoading = (state) => state.inventory.movementsLoading;
export const selectDeductionPreview = (state) => state.inventory.deductionPreview;
export const selectPreviewLoading = (state) => state.inventory.previewLoading;