import { createSlice } from '@reduxjs/toolkit';
import { 
  fetchActiveOrders, 
  fetchOrderHistory, 
  updateOrderStatusThunk, 
  completeOrderThunk 
} from './orderThunks';

const initialState = {
  orders: [],     
  history: [],      
  historyMeta: { total: 0, page: 1, limit: 10 },
  loading: false,
  actionLoading: false, 
  error: null,
  lastUpdated: null,
  isConnected: false, 
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Real-time: Add a single order pushed via Sockets
    addNewOrder: (state, action) => {
      const exists = state.orders.find(o => o._id === action.payload._id);
      if (!exists) {
        state.orders.unshift(action.payload); 
        state.lastUpdated = new Date().toISOString();
      }
    },

    /**
     * Real-time: Update order status from Socket events
     * Handles local state movement between active and history.
     */
    updateOrderStatusSuccess: (state, action) => {
      const { orderId, status } = action.payload;
      const index = state.orders.findIndex(o => o._id === orderId);
      
      if (index !== -1) {
        const updatedOrder = { ...state.orders[index], status };
        
        // If status is terminal, move it to history
        if (status === 'Completed' || status === 'Cancelled') {
          state.orders.splice(index, 1);
          // Check if it already exists in history to prevent duplicates
          const inHistory = state.history.find(o => o._id === orderId);
          if (!inHistory) state.history.unshift(updatedOrder);
        } else {
          // Otherwise, just update the status in the active list
          state.orders[index] = updatedOrder;
        }
        state.lastUpdated = new Date().toISOString();
      }
    },

    //System: Socket connectivity tracking
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },

    // UI: Error Cleanup
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH ACTIVE ORDERS
      .addCase(fetchActiveOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchActiveOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH ORDER HISTORY
      .addCase(fetchOrderHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.orders;
        state.historyMeta = {
          total: action.payload.total,
          page: action.payload.page,
          limit: state.historyMeta.limit,
        };
      })

      // UPDATE STATUS (Preparing / Ready)
      .addCase(updateOrderStatusThunk.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateOrderStatusThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedOrder = action.payload;
        const index = state.orders.findIndex(o => o._id === updatedOrder._id);
        
        if (index !== -1) {
          // If the thunk updated it to a terminal status, move it
          if (updatedOrder.status === 'Completed' || updatedOrder.status === 'Cancelled') {
             state.orders.splice(index, 1);
             state.history.unshift(updatedOrder);
          } else {
             state.orders[index] = updatedOrder;
          }
        }
      })
      .addCase(updateOrderStatusThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // COMPLETE / ARCHIVE ORDER
      .addCase(completeOrderThunk.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(completeOrderThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        const completedOrder = action.payload;
        const index = state.orders.findIndex(o => o._id === completedOrder._id);
        
        if (index !== -1) {
          state.orders.splice(index, 1);
          // Only add to history if not already present
          if (!state.history.find(o => o._id === completedOrder._id)) {
            state.history.unshift(completedOrder);
          }
        }
      })
      .addCase(completeOrderThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  addNewOrder, 
  updateOrderStatusSuccess, 
  setConnectionStatus,
  clearOrderError 
} = orderSlice.actions;

export default orderSlice.reducer;