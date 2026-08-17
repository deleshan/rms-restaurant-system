import { createSlice } from '@reduxjs/toolkit';
import {
  fetchInventoryItems,
  fetchInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
  acknowledgeLowStock,
  bulkAdjustStock,
  bulkUploadInventory,
  downloadInventoryTemplate,
  logPurchaseCSV,
  fetchStockMovements, 
  previewInventoryDeduction,
  importFromBarcode,
  importFromUSDA,
  lookupBarcodeProduct,
  searchFoodDatabase,
  confirmUSDAMatch
} from './inventoryThunks';

const initialState = {
  items: [],
  selectedItem: null,
  loading: false,
  uploading: false,
  error: null,
  successMessage: null, 
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  lowStockCount: 0,
  outOfStockCount: 0,
  expiringSoonCount: 0,
  totalStockValue: 0,
  movements: [],
  movementsLoading: false,
  deductionPreview: null,
  previewLoading: false,
  foodSearchResults: [],
  foodSearchLoading: false,
  barcodeProduct: null,
  barcodeLoading: false,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearInventoryStatus: (state) => {
      state.error = null;
      state.successMessage = null;
      state.uploading = false;
    },
    resetInventorySelection: (state) => {
      state.selectedItem = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // FETCH ALL ITEMS
      .addCase(fetchInventoryItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.totalCount = action.payload.totalCount || 0;
        state.currentPage = action.payload.page || 1;
        const summary = action.payload.summary || {};
        state.lowStockCount = summary.lowStockCount || 0;
        state.outOfStockCount = summary.outOfStockCount || 0;
        state.expiringSoonCount = summary.expiringSoonCount || 0;
        state.totalStockValue = summary.totalStockValue || 0;
      })
      .addCase(fetchInventoryItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // BULK UPLOAD (CREATE NEW)
      .addCase(bulkUploadInventory.pending, (state) => {
        state.uploading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(bulkUploadInventory.fulfilled, (state, action) => {
        state.uploading = false;
        state.successMessage = action.payload;
      })
      .addCase(bulkUploadInventory.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })

      // LOG PURCHASE (UPDATE EXISTING)
      .addCase(logPurchaseCSV.pending, (state) => {
        state.uploading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(logPurchaseCSV.fulfilled, (state, action) => {
        state.uploading = false;
        state.successMessage = action.payload;
      })
      .addCase(logPurchaseCSV.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })

      // FETCH SINGLE ITEM
      .addCase(fetchInventoryItemById.fulfilled, (state, action) => {
        state.selectedItem = action.payload;
      })

      // CREATE ITEM
      /**.addCase(createInventoryItem.fulfilled, (state, action) => {
        const newItem = action.payload.item || action.payload;
        state.items.unshift(newItem);
        state.totalCount += 1;
        state.successMessage = { message: 'New item added to inventory' };
        if (action.payload.summary) {
          const s = action.payload.summary;
          state.lowStockCount = s.lowStockCount;
          state.outOfStockCount = s.outOfStockCount;
          state.totalStockValue = s.totalStockValue;
        }
      })*/

      // DELETE ITEM
      .addCase(deleteInventoryItem.fulfilled, (state, action) => {
        state.items = state.items.filter(i => (i._id || i.id) !== action.payload);
        state.totalCount -= 1;
        state.successMessage = { message: 'Item removed from inventory' };
      })

      // BULK ADJUST
      .addCase(bulkAdjustStock.fulfilled, (state, action) => {
        const updatedItems = action.payload.items || action.payload || [];
        updatedItems.forEach(updatedItem => {
          const index = state.items.findIndex(i => (i._id || i.id) === (updatedItem._id || updatedItem.id));
          if (index !== -1) state.items[index] = updatedItem;
        });
        state.successMessage = { message: 'Bulk stock adjustment complete' };
      })

      // STOCK MOVEMENTS
      .addCase(fetchStockMovements.pending, (state) => {
        state.movementsLoading = true;
      })
      .addCase(fetchStockMovements.fulfilled, (state, action) => {
        state.movementsLoading = false;
        state.movements = action.payload.movements || [];
      })
      .addCase(fetchStockMovements.rejected, (state) => {
        state.movementsLoading = false;
      })

      // DEDUCTION PREVIEW
      .addCase(previewInventoryDeduction.pending, (state) => {
        state.previewLoading = true;
        state.deductionPreview = null;
      })
      .addCase(previewInventoryDeduction.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.deductionPreview = action.payload;
      })
      .addCase(previewInventoryDeduction.rejected, (state) => {
        state.previewLoading = false;
      })

      // FOOD DATABASE SEARCH
      .addCase(searchFoodDatabase.pending, (state) => {
        state.foodSearchLoading = true;
        state.foodSearchResults = [];
      })
      .addCase(searchFoodDatabase.fulfilled, (state, action) => {
        state.foodSearchLoading = false;
        state.foodSearchResults = action.payload;
      })
      .addCase(searchFoodDatabase.rejected, (state) => {
        state.foodSearchLoading = false;
      })

      // BARCODE LOOKUP
      .addCase(lookupBarcodeProduct.pending, (state) => {
        state.barcodeLoading = true;
        state.barcodeProduct = null;
      })
      .addCase(lookupBarcodeProduct.fulfilled, (state, action) => {
        state.barcodeLoading = false;
        state.barcodeProduct = action.payload;
      })
      .addCase(lookupBarcodeProduct.rejected, (state) => {
        state.barcodeLoading = false;
      })

      // IMPORT FROM USDA
      .addCase(importFromUSDA.pending, (state) => {
        state.error = null;
      })
      .addCase(importFromUSDA.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.successMessage = { message: `"${action.payload.name}" added from USDA database` };
      })
      .addCase(importFromUSDA.rejected, (state, action) => {
        state.error = action.payload;
      })

      // IMPORT FROM BARCODE
      .addCase(importFromBarcode.pending, (state) => {
        state.error = null;
      })
      .addCase(importFromBarcode.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.successMessage = { message: `"${action.payload.name}" added via barcode scan` };
      })
      .addCase(importFromBarcode.rejected, (state, action) => {
        state.error = action.payload;
      })

      // CONFIRM USDA MATCH
      .addCase(confirmUSDAMatch.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(confirmUSDAMatch.fulfilled, (state, action) => {
        state.uploading = false;
        if (action.payload?.item) {
          state.items.unshift(action.payload.item);
        }
        state.successMessage = { message: 'Item confirmed and added to inventory' };
      })
      .addCase(confirmUSDAMatch.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })

      // COMMON MATCHER — updateItem / adjustStock / acknowledgeLowStock
      .addMatcher(
        (action) => [
          updateInventoryItem.fulfilled.type,
          adjustStock.fulfilled.type,
          acknowledgeLowStock.fulfilled.type
        ].includes(action.type),
        (state, action) => {
          const updatedData = action.payload.item || action.payload;
          const index = state.items.findIndex(i => (i._id || i.id) === (updatedData._id || updatedData.id));
          if (index !== -1) state.items[index] = updatedData;
          if (state.selectedItem?._id === updatedData._id) {
            state.selectedItem = updatedData;
          }
          if (action.payload.summary) {
            const s = action.payload.summary;
            state.lowStockCount = s.lowStockCount;
            state.outOfStockCount = s.outOfStockCount;
            state.totalStockValue = s.totalStockValue;
            state.expiringSoonCount = s.expiringSoonCount;
          }
          state.successMessage = { message: 'Inventory updated successfully' };
          state.loading = false;
        }
      );
  },
});

export const { 
  clearInventoryStatus, 
  resetInventorySelection 
} = inventorySlice.actions;

export default inventorySlice.reducer;