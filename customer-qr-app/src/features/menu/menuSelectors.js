import { createSelector } from '@reduxjs/toolkit';

// Base selector
const selectMenu = (state) => state.menu;

// Get all raw items from the state
export const selectAllMenuItems = createSelector(
  [selectMenu],
  (menu) => menu.items || []
);

// Get the active category name (Mapping 'selectedCategory' from slice)
export const selectCurrentCategory = createSelector(
  [selectMenu],
  (menu) => menu.selectedCategory || 'All'
);

// Calculate filtered items
export const selectFilteredMenuItems = createSelector(
  [selectAllMenuItems, selectCurrentCategory],
  (items, currentCategory) => {
    if (currentCategory === 'All') return items;
    return items.filter(item => item.category === currentCategory);
  }
);

// Get available categories for the UI tabs
export const selectMenuCategories = createSelector(
  [selectMenu],
  (menu) => menu.categories || ['All']
);

// Loading & Error states
export const selectMenuLoading = createSelector(
  [selectMenu],
  (menu) => menu.loading
);

export const selectMenuError = createSelector(
  [selectMenu],
  (menu) => menu.error
);

// Combined Selector for MenuPage.jsx

export const selectMenuState = createSelector(
  [
    selectFilteredMenuItems,
    selectMenuCategories,
    selectCurrentCategory,
    selectMenuLoading,
    selectMenuError
  ],
  (filteredItems, categories, currentCategory, loading, error) => ({
    filteredItems,
    categories,
    currentCategory,
    loading,
    error,
  })
);