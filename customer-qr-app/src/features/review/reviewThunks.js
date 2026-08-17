import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { resetAfterReview } from '../orders/orderSlice';
import { updateCustomerDOB } from '../auth/authSlice';

/**
 * Submit complete review
 * @param {FormData} reviewData - Contains orderId, billingPreference, serviceRating, foodItemRatings (JSON string), feedback, and photo file
 */
export const submitReview = createAsyncThunk(
  'review/submitReview',
  async (reviewData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.submitReview(reviewData);

      dispatch(resetAfterReview());

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit review';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Optional: Upload photo separately 
 * Useful if you want to show a progress bar or upload the image before the final submit
 */
export const uploadReviewPhoto = createAsyncThunk(
  'review/uploadReviewPhoto',
  async ({ orderId, photoFile }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('orderId', orderId);

      const response = await api.uploadReviewPhoto(formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data.photoUrl;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload photo');
    }
  }
);

export const requestBillAction = createAsyncThunk(
  'review/requestBill',
  async ({ orderId, billingPreference, email = null, dateOfBirth = null }, { rejectWithValue }) => {
    try {
      const payload = { billingPreference };
      if (email) payload.email = email;
      if (dateOfBirth) payload.dateOfBirth = dateOfBirth; 

      const data = await api.updateBillRequest(orderId, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
)

export const saveCustomerDOB = createAsyncThunk(
  'review/saveCustomerDOB',
  async ({ phone, restaurantId, dateOfBirth }, { dispatch, rejectWithValue }) => {
    try {
      await api.updateCustomer(phone, { restaurantId, dateOfBirth });
      dispatch(updateCustomerDOB(dateOfBirth)); // update Redux + localStorage
      return dateOfBirth;
    } catch (error) {
      return rejectWithValue(error?.message || 'Could not save date of birth');
    }
  }
);