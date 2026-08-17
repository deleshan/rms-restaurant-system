import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

/**
 * FETCH ALL ORDERS
 * Supports status filtering for the OrderListPage
 * GET /api/orders
 */
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/orders', {
        params: {
          status: params.status !== 'all' ? params.status : undefined,
        },
      });
      const data = response.orders ? response : response.data;

      return {
        orders:     data.orders     || [],
        totalCount: data.totalCount || data.orders?.length || 0,
        page:       data.page       || 1,
        stats:      data.stats      || null,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err || 'Failed to load orders'
      );
    }
  }
);

/**
 * FETCH SINGLE ORDER BY ID
 * Used in OrderDetails page
 * GET /api/orders/:id
 */
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      const data = response.order ? response : response.data;
      return data.order || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err || 'Order not found'
      );
    }
  }
);

/**
 * UPDATE ORDER STATUS
 * Handles all status transitions:
 * Pending → Preparing → Ready → Completed
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status, isPaid }, { rejectWithValue }) => { 
    try {
      const response = await api.patch(`/orders/${id}/status`, { 
        status, 
        isPaid 
      });

      const data = response.order ? response : response.data;
      return data.order || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err || 'Status update failed'
      );
    }
  }
);

/**
 * MARK ORDER AS READY
 * FIX: Now uses /status route instead of non-existent /ready route
 * PATCH /api/orders/:id/status
 */
export const markOrderReady = createAsyncThunk(
  'orders/markOrderReady',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, {
        status: 'Ready',
      });

      const data = response.order ? response : response.data;
      return data.order || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err || 'Failed to mark order as ready'
      );
    }
  }
);

/**
 * COMPLETE ORDER
 * FIX: Now uses /status route instead of non-existent /complete route
 * PATCH /api/orders/:id/status
 */
export const completeOrder = createAsyncThunk(
  'orders/completeOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, {
        status: 'Completed',
      });

      const data = response.order ? response : response.data;
      return data.order || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err || 'Failed to complete order'
      );
    }
  }
);

/**
 * CANCEL ORDER
 * PATCH /api/orders/:id/cancel
 */
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/orders/${id}/cancel`, { reason });

      const data = response.order ? response : response.data;
      return data.order || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err || 'Cancellation failed'
      );
    }
  }
);

/**
 * CREATE MANUAL ORDER (Admin)
 * POST /api/orders
 */
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/orders', orderData);

      const data = response.order ? response : response.data;
      return data.order || data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err || 'Failed to create order'
      );
    }
  }
);