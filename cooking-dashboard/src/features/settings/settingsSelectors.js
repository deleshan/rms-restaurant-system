import { createSelector } from '@reduxjs/toolkit';

// Base State Selector
export const selectSettingsState = (state) => state.settings;

/**
 * Raw Value Selectors
 * These match the keys in your settingsSlice initialState.
 */
export const selectFontSize = (state) => state.settings.fontSize;
export const selectAudioAlertsEnabled = (state) => state.settings.audioAlerts;
export const selectCompactMode = (state) => state.settings.compactMode;
export const selectAutoArchive = (state) => state.settings.autoArchive;
export const selectRefreshInterval = (state) => state.settings.refreshInterval;
export const selectSettingsData = (state) => state.settings.settings;
/**
 * Derived Selector: Font Scaling
 * Maps 'small', 'medium', or 'large' to Tailwind CSS utility classes.
 * Use this in OrderCard.jsx to dynamically change text sizes.
 */
export const selectFontSizeClass = createSelector(
  [selectFontSize],
  (fontSize) => {
    switch (fontSize) {
      case 'small':
        return {
          body: 'text-xs',
          heading: 'text-sm',
          ticket: 'p-2',
          itemQty: 'w-7 h-7 text-sm'
        };
      case 'large':
        return {
          body: 'text-lg',
          heading: 'text-2xl',
          ticket: 'p-6',
          itemQty: 'w-12 h-12 text-2xl'
        };
      case 'medium':
      default:
        return {
          body: 'text-sm',
          heading: 'text-xl',
          ticket: 'p-4',
          itemQty: 'w-10 h-10 text-xl'
        };
    }
  }
);

/**
 * Derived Selector: Layout Density
 * Determines the grid columns and spacing based on Compact Mode.
 */
export const selectLayoutDensity = createSelector(
  [selectCompactMode],
  (isCompact) => ({
    gridClass: isCompact 
      ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3' 
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6',
    containerPadding: isCompact ? 'p-2' : 'p-6',
    cardSpacing: isCompact ? 'space-y-1' : 'space-y-4'
  })
);