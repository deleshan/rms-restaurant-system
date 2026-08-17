import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

/**
 * FETCH ALL TABLES
 * Gets the full list of tables for the current restaurant.
 */
export const fetchTables = createAsyncThunk(
  'tables/fetchAll',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/tables/${restaurantId}`);
      return response.data.data; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch tables');
    }
  }
);

/**
 * BULK CREATE TABLES
 * Creates a range of tables (e.g., 1 to 20) in one API call.
 */
export const bulkCreateTables = createAsyncThunk(
  'tables/bulkCreate',
  async (bulkData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/tables/bulk', bulkData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Bulk creation failed');
    }
  }
);

/**
 * UPDATE TABLE STATUS
 * Toggles status between 'Active', 'Inactive', 'Occupied'.
 */
export const updateTableStatus = createAsyncThunk(
  'tables/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/tables/${id}`, { status });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Update failed');
    }
  }
);

/**
 * DELETE TABLE
 * Removes a table from the database.
 */
export const deleteTable = createAsyncThunk(
  'tables/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/tables/${id}`);
      return id; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Delete failed');
    }
  }
);