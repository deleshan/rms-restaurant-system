import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

/**
 * Normalization helper to ensure the slice receives 
 * a consistent object structure.
 */
const normalizeMenuResponse = (response) => {
  const { data } = response;
  return {
    items: data.items || data.data || [],
    totalCount: data.totalCount || data.total || 0,
    page: data.page || 1,
    pageSize: data.pageSize || data.limit || 20,
  };
};

// Fetch Paginated & Filtered Menu Items
export const fetchMenuItems = createAsyncThunk(
  'menu/fetchItems',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const restaurantId = state.auth.user?.restaurantId;
      
      const response = await api.get('/menu/items-admin', {
        params: {
          restaurantId, 
          page: params.page || 1,
          limit: params.limit || 50,
          search: params.search || '',
          category: params.category !== 'all' ? params.category : undefined,
          station: params.station !== 'all' ? params.station : undefined,
          availability: params.availability,
          sortBy: params.sortBy || 'name',
          sortOrder: params.sortOrder || 'asc',
        },
      });
      return normalizeMenuResponse(response);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load menu items');
    }
  }
);

// Fetch Single Menu Item by ID
export const fetchMenuItemById = createAsyncThunk(
  'menu/fetchItemById',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/menu/items/${itemId}`);
      return {
        item: response.data.item || response.data,
        maxMakeable: response.data.maxMakeable ?? null,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Menu item not found');
    }
  }
);

// Create New Menu Item
export const createMenuItem = createAsyncThunk(
  'menu/createItem',
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await api.post('/menu/items', itemData);
      return response.data.item || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create menu item');
    }
  }
);


// Update Existing Menu Item
export const updateMenuItem = createAsyncThunk(
  'menu/updateItem',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/menu/items/${id}`, updates);
      return response.data.item || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update menu item');
    }
  }
);

// Delete Menu Item
export const deleteMenuItem = createAsyncThunk(
  'menu/deleteItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await api.delete(`/menu/items/${itemId}`);
      return itemId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete menu item');
    }
  }
);

// Toggle Availability (Partial Update)
export const toggleMenuItemAvailability = createAsyncThunk(
  'menu/toggleAvailability',
  async ({ id, isAvailable }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/menu/items/${id}/availability`, { isAvailable });
      return response.data.item || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update status');
    }
  }
);

// Fetch All Categories for Dropdowns
export const fetchMenuCategories = createAsyncThunk(
  'menu/fetchCategories',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const restaurantId = state.auth.user?.restaurantId;

      const response = await api.get('/menu/categories', {
        params: { restaurantId }
      });
      return response.data.categories || response.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load categories');
    }
  }
);

// Fetch menu item insight
export const fetchMenuItemInsight = createAsyncThunk(
  'menu/fetchItemInsight',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/menu/${itemId}/insight`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load insight');
    }
  }
);


// bulk upload New Menu Item
export const bulkUploadMenuItems = createAsyncThunk(
  'menu/bulkUpload',
  async (items, { getState, rejectWithValue }) => {  // ← items, not file
    try {
      const state = getState();
      const restaurantId = state.auth.user?.restaurantId;

      const response = await api.post('/menu/items/bulk-upload', {
        items,          // ← send as JSON body
        restaurantId,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Bulk upload failed');
    }
  }
);

// Update ingredients/recipe for a menu item
export const updateMenuItemIngredients = createAsyncThunk(
  'menu/updateIngredients',
  async ({ id, ingredients, customizationOptions }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/menu/${id}/ingredients`, {
        ingredients,
        customizationOptions
      });
      return response.data.item || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update recipe');
    }
  }
);