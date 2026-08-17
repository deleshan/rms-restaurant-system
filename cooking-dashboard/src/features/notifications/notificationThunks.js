import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
 
/**
 * FETCH NOTIFICATIONS
 * GET /api/notifications
 */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications');
      const data = response.notifications ? response : response.data;
      return {
        notifications: data.notifications || [],
        unreadCount: data.unreadCount || 0,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err || 'Failed to load notifications'
      );
    }
  }
);
 
/**
 * MARK SINGLE NOTIFICATION AS READ
 * PATCH /api/notifications/:id/read
 */
export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      const data = response.notification ? response : response.data;
      return data.notification || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err || 'Failed to update notification'
      );
    }
  }
);
 
/**
 * MARK ALL NOTIFICATIONS AS READ
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllNotificationsRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.patch('/notifications/read-all');
      return true;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err || 'Failed to update notifications'
      );
    }
  }
);