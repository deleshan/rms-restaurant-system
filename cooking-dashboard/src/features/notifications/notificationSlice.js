import { createSlice } from '@reduxjs/toolkit';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notificationThunks';
 
const initialState = {
  list: [],
  unreadCount: 0,
  loading: false,
  error: null,
};
 
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    resetNotificationsState: () => initialState,
 
    socketNotificationReceived: (state, action) => {
      const exists = state.list.some((n) => n._id === action.payload._id);
      if (!exists) {
        state.list.unshift(action.payload);
        state.unreadCount += 1;
      }
    },
  },
 
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.loading = true;
      state.error = null;
    };
 
    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Something went wrong';
    };
 
    builder
      .addCase(fetchNotifications.pending, handlePending)
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, handleRejected)
 
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.list.findIndex((n) => n._id === updated._id);
        if (index !== -1) {
          const wasUnread = !state.list[index].isRead;
          state.list[index] = updated;
          if (wasUnread && updated.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
 
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.list = state.list.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      });
  },
});
 
export const {
  clearNotificationError,
  resetNotificationsState,
  socketNotificationReceived,
} = notificationSlice.actions;
 
export default notificationSlice.reducer;
 