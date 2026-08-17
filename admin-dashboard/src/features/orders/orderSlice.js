import { createSlice } from '@reduxjs/toolkit';
import {
  fetchOrders,
  fetchOrderById,
  createOrder,
  updateOrderStatus,
  markOrderReady,
  completeOrder,
  cancelOrder,
} from './orderThunks';

const initialState = {
  list:           [],
  selectedOrder: null,
  loading:       false,
  error:         null,
  successMessage: null,
  totalCount:    0,
  currentPage:   1,
  stats: {
    totalOrders: 0,
    pending:     0,
    preparing:   0,
    ready:       0,
    completed:   0,
    cancelled:   0,
    totalRevenue: 0,
  },
};

/**
 * Enhanced Helper to update an order in the list 
 * Now handles both full objects (from API) and partial updates (from Sockets)
 */
const updateOrderInList = (state, payload) => {
  const orderId = payload._id || payload.orderId;
  const index = state.list.findIndex((o) => o._id === orderId);

  if (index !== -1) {
    if (payload._id) {
      // Full object replacement (API response)
      state.list[index] = payload;
    } else {
      // Partial update (Socket message: { orderId, status, isPaid, etc. })
      state.list[index] = { ...state.list[index], ...payload };
    }
  }

  // Sync with selectedOrder if currently viewed
  if (state.selectedOrder?._id === orderId) {
    state.selectedOrder = payload._id 
      ? payload 
      : { ...state.selectedOrder, ...payload };
  }
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearOrderSuccess: (state) => {
      state.successMessage = null;
    },
    resetOrdersState: () => initialState,

    /**
     * Real-time socket update
     * Handles incoming { orderId, status, isPaid, billRequested, billingPreference }
     */
    socketOrderUpdated: (state, action) => {
      updateOrderInList(state, action.payload);
    },

    /* Real-time new order */
    socketNewOrder: (state, action) => {
      const exists = state.list.some((o) => o._id === action.payload._id);
      if (!exists) {
        state.list.unshift(action.payload);
        state.totalCount += 1;
        state.stats.totalOrders += 1;
        state.stats.pending += 1;
      }
    },
  },

  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.loading = true;
      state.error   = null;
    };

    const handleRejected = (state, action) => {
      state.loading = false;
      state.error   = action.payload || 'Something went wrong';
    };

    builder
      // Fetch Orders List 
      .addCase(fetchOrders.pending, handlePending)
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading      = false;
        state.list         = action.payload.orders;
        state.totalCount   = action.payload.totalCount;
        state.currentPage  = action.payload.page;
        if (action.payload.stats) {
          state.stats = { ...state.stats, ...action.payload.stats };
        }
      })
      .addCase(fetchOrders.rejected, handleRejected)

      // Fetch Single Order 
      .addCase(fetchOrderById.pending, handlePending)
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading       = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, handleRejected)

      // Create Order 
      .addCase(createOrder.pending, handlePending)
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.totalCount        += 1;
        state.stats.totalOrders += 1;
        state.stats.pending     += 1;
        state.successMessage     = 'Order placed successfully';
      })
      .addCase(createOrder.rejected, handleRejected)

      // Update Order Status & Payment
      .addCase(updateOrderStatus.pending, handlePending)
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload;
        updateOrderInList(state, updatedOrder);

        if (updatedOrder.isPaid && updatedOrder.status === 'Completed') {
          state.successMessage = 'Order completed and payment confirmed';
        } else if (updatedOrder.isPaid) {
          state.successMessage = 'Payment status updated to PAID';
        } else {
          state.successMessage = `Order is now ${updatedOrder.status}`;
        }
      })
      .addCase(updateOrderStatus.rejected, handleRejected)

      // Mark Order Ready 
      .addCase(markOrderReady.pending, handlePending)
      .addCase(markOrderReady.fulfilled, (state, action) => {
        state.loading = false;
        updateOrderInList(state, action.payload);
        state.successMessage = 'Order is ready for pickup';
      })
      .addCase(markOrderReady.rejected, handleRejected)

      // omplete Order 
      .addCase(completeOrder.pending, handlePending)
      .addCase(completeOrder.fulfilled, (state, action) => {
        state.loading = false;
        updateOrderInList(state, action.payload);
        state.stats.completed += 1;
        state.successMessage   = 'Order completed';
      })
      .addCase(completeOrder.rejected, handleRejected)

      // Cancel Order 
      .addCase(cancelOrder.pending, handlePending)
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        updateOrderInList(state, action.payload);
        state.stats.cancelled += 1;
        state.successMessage   = 'Order has been cancelled';
      })
      .addCase(cancelOrder.rejected, handleRejected);
  },
});

export const {
  clearOrderError,
  clearOrderSuccess,
  resetOrdersState,
  socketOrderUpdated,
  socketNewOrder,
} = ordersSlice.actions;

export default ordersSlice.reducer;