import { createSelector } from '@reduxjs/toolkit';
 
export const selectNotificationsState = (state) => state.notifications || {};
 
export const selectAllNotifications = createSelector(
  [selectNotificationsState],
  (notifications) => notifications.list || []
);
 
export const selectUnreadCount = createSelector(
  [selectNotificationsState],
  (notifications) => notifications.unreadCount || 0
);
 
export const selectNotificationsLoading = createSelector(
  [selectNotificationsState],
  (notifications) => !!notifications.loading
);