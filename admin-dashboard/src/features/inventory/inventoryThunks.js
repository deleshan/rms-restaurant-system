import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

/* Helper to normalize inventory list responses. */
const normalizeInventoryResponse = (response) => {
  const { data } = response;
  return {
    items: data.items || data.data || [],
    totalCount: data.totalCount || data.total || 0,
    page: data.page || 1,
    pageSize: data.pageSize || data.limit || 20,
    summary: data.summary || {
      lowStockCount: 0,
      outOfStockCount: 0,
      totalStockValue: 0,
      expiringSoonCount: 0,
    }
  };
};

// Fetch Paginated & Filtered Inventory
export const fetchInventoryItems = createAsyncThunk(
  'inventory/fetchItems',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/inventory/items', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search || '',
          category: params.category !== 'all' ? params.category : undefined,
          lowStockOnly: params.lowStockOnly || false,
        },
      });
      return normalizeInventoryResponse(response);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load inventory');
    }
  }
);

/**
 * Bulk Upload CSV File
 * Handles multipart/form-data for the inventory import.
 */
export const bulkUploadInventory = createAsyncThunk(
  'inventory/bulkUpload',
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/inventory/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      dispatch(fetchInventoryItems());
      
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Bulk upload failed');
    }
  }
);

/**
 * @desc    Download CSV Template based on mode (import or purchase)
 * @param   {string} mode - 'import' or 'purchase'
 */
export const downloadInventoryTemplate = createAsyncThunk(
  'inventory/downloadTemplate',
  async (mode = 'import', { rejectWithValue }) => {
    try {
      // Pass the mode as a query parameter to the backend
      const response = await api.get(`/inventory/template?type=${mode}`, {
        responseType: 'blob', // Critical for handling binary/file data
      });

      // Create a Blob from the response data
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      // Define a dynamic filename based on the mode
      const filename = mode === 'purchase' 
        ? 'purchase_restock_template.csv' 
        : 'inventory_import_template.csv';

      // Create a hidden link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      console.error('Template download error:', err);
      return rejectWithValue('Failed to download the CSV template. Please try again.');
    }
  }
);

// Fetch Single Item Details
export const fetchInventoryItemById = createAsyncThunk(
  'inventory/fetchItemById',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/inventory/items/${itemId}`);
      return response.data.item || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Item not found');
    }
  }
);

// Create New Inventory Item (Single)
/**export const createInventoryItem = createAsyncThunk(
  'inventory/createItem',
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await api.post('/inventory/items', itemData);
      return response.data.item || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create item');
    }
  }
);*/

// Update Existing Item
export const updateInventoryItem = createAsyncThunk(
  'inventory/updateItem',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/inventory/items/${id}`, updates);
      return response.data.item || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Update failed');
    }
  }
);

// Delete Item from Database
export const deleteInventoryItem = createAsyncThunk(
  'inventory/deleteItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await api.delete(`/inventory/items/${itemId}`);
      return itemId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Delete failed');
    }
  }
);

// Stock Adjustment
export const adjustStock = createAsyncThunk(
  'inventory/adjustStock',
  async ({ itemId, quantity, reason, type = 'adjustment' }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/inventory/items/${itemId}/stock`, {
        quantity,
        reason,
        type,
      });
      return response.data.item || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Stock adjustment failed');
    }
  }
);

// Acknowledge Low Stock Alerts
export const acknowledgeLowStock = createAsyncThunk(
  'inventory/acknowledgeLowStock',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/inventory/items/${itemId}/acknowledge-low-stock`);
      return response.data.item || response.data;
    } catch (err) {
      return rejectWithValue('Could not clear alert');
    }
  }
);

/**
 * Bulk Stock Adjustment
 * Updates quantities for multiple items in one request.
 */
export const bulkAdjustStock = createAsyncThunk(
  'inventory/bulkAdjustStock',
  async ({ items }, { rejectWithValue }) => {
    try {
      const response = await api.post('/inventory/bulk-stock-adjust', { items });
      // Returns the array of updated items from the server
      return response.data.updatedItems || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Bulk adjustment failed');
    }
  }
);

export const logPurchaseCSV = createAsyncThunk(
  'inventory/logPurchaseCSV',
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      // Using your API instance correctly
      const response = await api.post('/inventory/log-purchase', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Refresh the list so the UI reflects the new stock immediately
      dispatch(fetchInventoryItems({ page: 1, limit: 100 }));
      
      return response.data;
    } catch (err) {
      // Defensive error handling: check if err.response and data exist
      // This prevents "Cannot read property 'data' of undefined" errors
      const errorMessage = err.response?.data?.message || 'Failed to log purchase. Please check your CSV format.';
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch stock movement history for an inventory item
export const fetchStockMovements = createAsyncThunk(
  'inventory/fetchStockMovements',
  async ({ itemId, page = 1, limit = 50, type }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/inventory/items/${itemId}/movements`, {
        params: { page, limit, type }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch movements');
    }
  }
);

// Preview ingredient deduction before confirming
export const previewInventoryDeduction = createAsyncThunk(
  'inventory/previewDeduction',
  async (items, { rejectWithValue }) => {
    try {
      const response = await api.post('/inventory/preview-deduction', { items });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Preview failed');
    }
  }
);

// Search USDA food database
export const searchFoodDatabase = createAsyncThunk(
  'inventory/searchFoodDatabase',
  async ({ query, source = 'usda' }, { rejectWithValue }) => {
    try {
      const response = await api.get('/inventory/food-search', {
        params: { q: query, source }
      });
      return response.data.results || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Search failed');
    }
  }
);

// Barcode lookup
export const lookupBarcodeProduct = createAsyncThunk(
  'inventory/lookupBarcode',
  async (barcode, { rejectWithValue }) => {
    try {
      const response = await api.get(`/inventory/barcode/${barcode}`);
      return response.data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Barcode not found');
    }
  }
);

// Import from USDA into inventory
export const importFromUSDA = createAsyncThunk(
  'inventory/importFromUSDA',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/inventory/import-from-usda', payload);
      dispatch(fetchInventoryItems({ page: 1, limit: 100 }));
      return response.data.item;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Import failed');
    }
  }
);

// Import from barcode scan into inventory
export const importFromBarcode = createAsyncThunk(
  'inventory/importFromBarcode',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/inventory/import-from-barcode', payload);
      dispatch(fetchInventoryItems({ page: 1, limit: 100 }));
      return response.data.item;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Barcode import failed');
    }
  }
);

// Confirm USDA match thunk
export const confirmUSDAMatch = createAsyncThunk(
  'inventory/confirmUSDAMatch',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/inventory/confirm-usda-match', payload);
      // Refresh list to update UI state
      dispatch(fetchInventoryItems({ page: 1, limit: 100 }));
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to confirm USDA match');
    }
  }
);