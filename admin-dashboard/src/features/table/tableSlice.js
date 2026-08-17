import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { 
  fetchTables, 
  bulkCreateTables, 
  updateTableStatus, 
  deleteTable 
} from './tableThunks'; 


const tableSlice = createSlice({
  name: 'tables',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearTableError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tables
      .addCase(fetchTables.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Bulk Create
      .addCase(bulkCreateTables.fulfilled, (state, action) => {
        state.items = [...state.items, ...action.payload];
        state.successMessage = 'Tables generated successfully!';
      })

      // Update Status
      .addCase(updateTableStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      // Delete Table
      .addCase(deleteTable.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t._id !== action.payload);
      });
  }
});

export const { clearTableMessages } = tableSlice.actions;
export default tableSlice.reducer;