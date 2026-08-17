import { createSlice } from '@reduxjs/toolkit';
import { 
  fetchInventory, 
  toggleItemAvailability, 
  updateStockLevel 
} from './inventoryThunks';

const initialState = {
  items: [],
  loading: false,
  isUpdating: false, 
  error: null,
  lastUpdated: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    /**
     * Socket Update: Real-time sync
     * Triggered when another terminal or the POS updates an item.
     */
    updateItemStatus: (state, action) => {
      const { itemId, isAvailable, stock } = action.payload;
      const item = state.items.find(i => i._id === itemId);
      
      if (item) {
        if (isAvailable !== undefined) item.isAvailable = isAvailable;
        if (stock !== undefined) item.stock = stock;
        state.lastUpdated = new Date().toISOString();
      }
    },

    /**
     * Cleanup: Clear errors when navigating away
     */
    clearInventoryError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // FETCH ALL INVENTORY 
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // TOGGLE AVAILABILITY (86-ING)
      .addCase(toggleItemAvailability.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(toggleItemAvailability.fulfilled, (state, action) => {
        state.isUpdating = false;
        const { itemId, isAvailable } = action.payload;
        const item = state.items.find(i => i._id === itemId);
        if (item) {
          item.isAvailable = isAvailable;
        }
      })
      .addCase(toggleItemAvailability.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // UPDATE STOCK QUANTITY 
      .addCase(updateStockLevel.fulfilled, (state, action) => {
        const { itemId, stock } = action.payload;
        const item = state.items.find(i => i._id === itemId);
        if (item) {
          item.stock = stock;
        }
      });
  },
});

export const { updateItemStatus, clearInventoryError } = inventorySlice.actions;

export default inventorySlice.reducer;