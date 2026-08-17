import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../utils/api';


export const fetchMenu = createAsyncThunk(
  'menu/fetchMenu',
  async (restaurantId, { rejectWithValue }) => {
    try {
      if (!restaurantId) {
        return rejectWithValue('No restaurant context found. Please re-scan QR code.');
      }
      const data = await apiService.getMenu(restaurantId);
      
      return data; 
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Refresh menu thunk
 
export const refreshMenu = createAsyncThunk(
  'menu/refreshMenu',
  async (restaurantId, { dispatch, rejectWithValue }) => {
    try {
      await dispatch(fetchMenu(restaurantId)).unwrap();
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);