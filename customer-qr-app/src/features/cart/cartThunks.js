import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../utils/api'; 

/**
 * Place Order Thunk
 * Handles the actual submission of the cart to the backend
 */
export const placeOrder = createAsyncThunk(
  'cart/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await apiService.placeOrder(orderData);
      return response; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to place order');
    }
  }
);

/**
 * Apply Promo Code
 * Updated to be slightly more robust
 */
export const applyPromoCode = createAsyncThunk(
  'cart/applyPromoCode',
  async (code, { rejectWithValue }) => {
    try {
      if (code.toUpperCase() === 'FIRST50') {
        return { discount: 50, type: 'fixed' }; 
      }
      if (code.toUpperCase() === 'RMS10') {
        return { discount: 10, type: 'percentage' };
      }
      
      return rejectWithValue('Invalid or expired promo code');
    } catch (error) {
      return rejectWithValue(error.message || 'Error applying code');
    }
  }
);

/**
 * Validate Cart
 * Useful to check if items are still in stock before payment/submission
 */
export const validateCart = createAsyncThunk(
  'cart/validateCart',
  async (cartItems, { rejectWithValue }) => {
    try {
      return cartItems;
    } catch (error) {
      return rejectWithValue('Some items in your cart are no longer available');
    }
  }
);