import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
import { toast } from '@/components/common/Toast';

/**
 * Fetch Active KDS Orders
 * Fetches: Pending, Preparing, Ready
 * Implementation: Uses the staff's token to identify the restaurant.
 */
export const fetchActiveOrders = createAsyncThunk(
  'orders/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders/kds/active');
      return response.data.orders || [];
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch active orders';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch Order History
 * Fetches: Completed, Cancelled
 */
export const fetchOrderHistory = createAsyncThunk(
  'orders/fetchHistory',
  async ({ page = 1, limit = 10, station = 'All' } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (station !== 'All') params.station = station;
      const response = await api.get('/orders/kds/history', { params });
      return response.data; // { orders, total, page }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load archives.';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update Order Status
 * Transition: Pending -> Preparing -> Ready
 */
export const updateOrderStatusThunk = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status });
      
      // Visual feedback for the Chef
      toast.success(`Order #${orderId.slice(-4)} is now ${status}`);
      
      return response.data.order; 
    } catch (err) {
      const message = err.response?.data?.message || 'Status update failed.';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Complete / Archive Order
 * Transition: Ready -> Completed
 * This removes the order from the Live Grid and moves it to History.
 */
export const completeOrderThunk = createAsyncThunk(
  'orders/complete',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { 
        status: 'Completed' 
      });
      
      toast.success('Order Archived');
      return response.data.order; 
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to archive order.';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

/**
 * Update Inventory Item (Bonus)
 * Useful for the "86" (Out of Stock) feature in the KDS.
 */
export const toggleItemAvailability = createAsyncThunk(
  'orders/toggleItem',
  async ({ itemId, isAvailable }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/inventory/toggle/${itemId}`, { isAvailable });
      toast.info(`Item visibility updated`);
      return response.data.item;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Inventory sync failed');
    }
  }
);