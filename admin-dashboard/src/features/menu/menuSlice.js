import { createSlice } from '@reduxjs/toolkit';
import {
  fetchMenuItems,
  fetchMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  fetchMenuCategories,
  fetchMenuItemInsight,
  bulkUploadMenuItems,
  updateMenuItemIngredients
} from './menuThunks';

const initialState = {
  items: [],
  categories: [],
  selectedItem: null,
  loading: false,
  error: null,
  successMessage: null,
  selectedCategory: 'All',
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  insight: null,
  insightLoading: false,
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    clearMenuStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearMenuSuccess: (state) => {
      state.successMessage = null;
    },
    resetMenuSelection: (state) => {
      state.selectedItem = null;
    }
  },
  extraReducers: (builder) => {
    const setPending = (state) => {
      state.loading = true;
      state.error = null;
    };

    const setRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      // All .addCase calls go first
      .addCase(fetchMenuItems.pending, setPending)
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.currentPage = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchMenuItems.rejected, setRejected)
      .addCase(fetchMenuItemById.fulfilled, (state, action) => {
        state.selectedItem = action.payload.item;
        state.selectedItemMaxMakeable = action.payload.maxMakeable;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.totalCount += 1;
        state.successMessage = 'Menu item added successfully';
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.items = state.items.filter(i => (i._id || i.id) !== action.payload);
        state.totalCount -= 1;
        state.successMessage = 'Menu item removed successfully';
      })
      
      .addCase(fetchMenuCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })

      .addCase(fetchMenuItemInsight.pending, (state) => {
        state.insightLoading = true;
      })
      .addCase(fetchMenuItemInsight.fulfilled, (state, action) => {
        state.insightLoading = false;
        state.insight = action.payload;
      })
      .addCase(fetchMenuItemInsight.rejected, (state, action) => {
        state.insightLoading = false;
        state.error = action.payload;
      })
      .addCase(bulkUploadMenuItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkUploadMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        const { upserted = 0, modified = 0 } = action.payload.details || {};
        state.successMessage = `${upserted} new item${upserted !== 1 ? 's' : ''} added, ${modified} updated`;
      })
      .addCase(bulkUploadMenuItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateMenuItemIngredients.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          i => (i._id || i.id) === (action.payload._id || action.payload.id)
        );
        if (index !== -1) state.items[index] = action.payload;
        if (state.selectedItem?._id === action.payload._id) {
          state.selectedItem = action.payload;
        }
        state.successMessage = 'Recipe updated successfully';
      })
      .addCase(updateMenuItemIngredients.rejected, (state, action) => {
        state.error = action.payload;
      })

      // All .addMatcher calls go AFTER .addCase
      .addMatcher(
        (action) => [updateMenuItem.fulfilled.type, toggleMenuItemAvailability.fulfilled.type].includes(action.type),
        (state, action) => {
          const index = state.items.findIndex(i => (i._id || i.id) === (action.payload._id || action.payload.id));
          if (index !== -1) {
            state.items[index] = action.payload;
          }
          if (state.selectedItem && state.selectedItem._id === action.payload._id) {
            state.selectedItem = action.payload;
          }
          state.successMessage = action.type.includes('toggle') 
            ? `Item is now ${action.payload.isAvailable ? 'Available' : 'Unavailable'}`
            : 'Menu item updated successfully';
        }
      );
  },
});


export const { 
  clearMenuStatus, 
  clearMenuSuccess, 
  resetMenuSelection 
} = menuSlice.actions;

export default menuSlice.reducer;