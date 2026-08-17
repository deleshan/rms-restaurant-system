import { createSlice } from '@reduxjs/toolkit';
import {
  placeOrder,
  fetchOrderById,
  fetchCustomerOrders,
  fetchCurrentOrder,
  fetchPastOrders,
} from './orderThunks';

const initialState = {
  currentOrder: null,      // Active order (Pending, Preparing, Ready)
  lastOrderId: null,
  pastOrders: [],          
  loading: false,
  error: null,
  isPaid: false,           
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    /**
     * Real-time status update via Socket.io
     * Payload: { orderId: string, status: string }
     */
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      if (state.currentOrder && state.currentOrder._id === orderId) {
        state.currentOrder.status = status;

        if (status === 'Completed') {
          state.isPaid = true;
        }
      }
    },

    /**
     * Clear all order state on logout
     */
    clearOrders: (state) => {
      state.currentOrder = null;
      state.pastOrders = [];
      state.loading = false;
      state.error = null;
      state.isPaid = false;
    },

    /**
     * Triggered by Socket.io 'ORDER_COMPLETED' or manual mark
     * Moves current order out of active view
     */
    markAsPaid: (state) => {
      
      if (state.currentOrder) {
        state.lastOrderId = state.currentOrder._id;
      }
      state.isPaid = true;
      state.currentOrder = null;
    },

    /**
     * Reset after customer submits a review
     */
    resetAfterReview: (state) => {
      state.isPaid = false;
      state.lastOrderId = null;
    },

    /**
     * Clear error state (useful for dismissing error toasts)
     */
    clearOrderError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Place Order
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.isPaid = false;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to place order';
      })

      // Fetch Order By ID 
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        // If the fetched order is active, restore it as current
        const activeStatuses = ['Pending', 'Preparing', 'Ready'];
        if (activeStatuses.includes(action.payload?.status)) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch order';
      })

      // Fetch Customer Orders (Combined — preferred)
      .addCase(fetchCustomerOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.current;
        state.pastOrders = action.payload.past;
      })
      .addCase(fetchCustomerOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch orders';
      })

      // Fetch Current Order Only 
      .addCase(fetchCurrentOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchCurrentOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch current order';
      })

      // Fetch Past Orders Only 
      .addCase(fetchPastOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPastOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.pastOrders = action.payload;
      })
      .addCase(fetchPastOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch past orders';
      });
  },
});

export const {
  updateOrderStatus,
  clearOrders,
  markAsPaid,
  resetAfterReview,
  clearOrderError,
} = orderSlice.actions;

export default orderSlice.reducer;