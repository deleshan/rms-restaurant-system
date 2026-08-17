import { createSelector } from '@reduxjs/toolkit';

// Base Selector
export const selectMenuState = (state) => state.menu;

// Direct Data Selectors
export const selectAllMenuItems = createSelector(
  [selectMenuState],
  (menu) => menu.items || []
);

export const selectMenuCategories = createSelector(
  [selectMenuState],
  (menu) => menu.categories || []
);

export const selectMenuLoading = createSelector(
  [selectMenuState],
  (menu) => menu.loading
);

export const selectMenuError = createSelector(
  [selectMenuState],
  (menu) => menu.error
);

export const selectMenuSuccessMessage = createSelector(
  [selectMenuState],
  (menu) => menu.successMessage
);

export const selectSelectedMenuItem = createSelector(
  [selectMenuState],
  (menu) => menu.selectedItem
);

// Derived Count Selectors
export const selectTotalMenuCount = createSelector(
  [selectAllMenuItems],
  (items) => items.length
);

export const selectAvailableItemCount = createSelector(
  [selectAllMenuItems],
  (items) => items.filter(item => item.isAvailable).length
);

export const selectMenuItemInsight = createSelector(
  [selectMenuState],
  (menu) => menu.insight
);

export const selectMenuInsightLoading = createSelector(
  [selectMenuState],
  (menu) => menu.insightLoading
);

// Advanced Filtered Selectors
export const selectFilteredMenu = (searchTerm, category, availability, station) =>
  createSelector([selectAllMenuItems], (items) => {
    return items.filter((item) => {
      const matchesSearch = !searchTerm ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = category === 'all' || item.category === category;

      const matchesAvailability = availability === 'all' ||
        (availability === 'available' ? item.isAvailable : !item.isAvailable);

      const matchesStation = !station || station === 'all' || item.station === station; // ← new

      return matchesSearch && matchesCategory && matchesAvailability && matchesStation;
    });
  });

// Statistics for Dashboard Charts
export const selectMenuPriceAnalytics = createSelector(
  [selectAllMenuItems],
  (items) => {
    if (items.length === 0) return { min: 0, max: 0, avg: 0 };
    const prices = items.map(i => i.price || 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / items.length
    };
  }
);

// Popular / Top Items (if orderCount exists)
export const selectTopRatedItems = createSelector(
  [selectAllMenuItems],
  (items) => [...items]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5)
);

// Get a single menu item with its populated ingredients
export const selectMenuItemWithIngredients = createSelector(
  [selectSelectedMenuItem],
  (item) => {
    if (!item) return null;
    return {
      ...item,
      hasRecipe: item.ingredients?.length > 0,
      ingredientCount: item.ingredients?.length || 0
    };
  }
);

export const STATION_OPTIONS = ['Hot Station', 'Cold Station', 'Bar / Drinks'];

export const selectSelectedItemMaxMakeable = createSelector(
  [selectMenuState],
  (menu) => menu.selectedItemMaxMakeable
);