import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api'; 

/**
 * Fetch the complete menu inventory
 * Used to populate the 86-list and stock management view.
 */
export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/inventory/items');
      return response.data.items; // or return response.data and store summary too
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch inventory.');
    }
  }
);

/**
 * Toggle Item Availability (The "86" Command)
 * Moves an item between 'Available' and '86-ed' (Sold Out).
 * @param {Object} data - { itemId: string, isAvailable: boolean }
 */
export const toggleItemAvailability = createAsyncThunk(
  'inventory/toggleAvailability',
  async ({ itemId, isAvailable }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/inventory/${itemId}/availability`, { 
        isAvailable 
      });

      return { 
        itemId, 
        isAvailable: response.data.isAvailable 
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update availability.';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update Specific Stock Count
 * Useful for high-demand items or daily specials.
 * @param {Object} data - { itemId: string, stock: number }
 */
export const updateStockLevel = createAsyncThunk(
  'inventory/updateStock',
  async ({ itemId, stock }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/inventory/${itemId}/stock`, { 
        stock 
      });

      return { 
        itemId, 
        stock: response.data.stock 
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update stock.';
      return rejectWithValue(message);
    }
  }
);