import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../utils/api';
import { setProfile } from '../profile/profileSlice';

/**
 * Submit initial form to backend
 */
export const submitInitialForm = createAsyncThunk(
  'auth/submitInitialForm',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiService.registerCustomer(formData);
      const customerData = response.customer || response;

      dispatch(setProfile({
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,      
        address: customerData.homeAddress || '',
      }));

      return {
        customer: {
          ...customerData,
          address: customerData.homeAddress,
          tableId: formData.tableId,
          restaurantId: formData.restaurantId
        }
      };
    } catch (error) {
      const message = typeof error === 'string' ? error : (error.response?.data?.message || 'Check-in failed');
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch customer details by phone
 */
export const fetchCustomerByPhone = createAsyncThunk(
  'auth/fetchCustomerByPhone',
  async ({ phone, restaurantId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiService.getCustomerByPhone(phone, restaurantId);
      const customerData = response.customer || response;

      dispatch(setProfile({
        ...customerData,
        address: customerData.homeAddress || customerData.address || '',
      }));

      return { customer: customerData };
    } catch (error) {
      const message = typeof error === 'string' ? error : (error.response?.data?.message || 'Failed to fetch customer');
      return rejectWithValue(message);
    }
  }
);