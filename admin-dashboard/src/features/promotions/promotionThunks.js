import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

/**
 * Normalizes the backend response to ensure the slice 
 * always receives a consistent object structure.
 */
const normalizePromotionResponse = (response) => {
  const { data } = response;
  return {
    promotions: data.promotions || data.data || [],
    totalCount: data.totalCount || data.total || 0,
    page: data.page || 1,
    pageSize: data.pageSize || data.limit || 10,
  };
};

// Fetch Paginated & Filtered Promotions
export const fetchPromotions = createAsyncThunk(
  'promotions/fetchPromotions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/promotions');
      return normalizePromotionResponse(response);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load promotions'
      );
    }
  }
);

// Get Single Promotion by ID
export const fetchPromotionById = createAsyncThunk(
  'promotions/fetchPromotionById',
  async (promotionId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/promotions/${promotionId}`);
      return response.data.promotion || response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Promotion not found'
      );
    }
  }
);

// Create New Promotion
export const createPromotion = createAsyncThunk(
  'promotions/createPromotion',
  async (promotionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/promotions', promotionData);
      return response.data.promotion || response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create promotion'
      );
    }
  }
);

// Update Existing Promotion
export const updatePromotion = createAsyncThunk(
  'promotions/updatePromotion',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/promotions/${id}`, updates);
      return response.data.promotion || response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update promotion'
      );
    }
  }
);

// Delete Promotion
export const deletePromotion = createAsyncThunk(
  'promotions/deletePromotion',
  async (promotionId, { rejectWithValue }) => {
    try {
      await api.delete(`/promotions/${promotionId}`);
      return promotionId; 
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete promotion'
      );
    }
  }
);

// Toggle Promotion Active/Inactive Status
// Uses PATCH for better performance (partial update)
export const togglePromotionStatus = createAsyncThunk(
  'promotions/toggleStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/promotions/${id}/status`, { isActive });
      return response.data.promotion || response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update promotion status'
      );
    }
  }
);

// Validate Promo Code (Used in Checkout/Order flow)
export const validatePromoCode = createAsyncThunk(
  'promotions/validateCode',
  async ({ code, cartTotal, restaurantId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/promotions/validate', { 
        code, 
        cartTotal, 
        restaurantId 
      });
      return response.data.discountDetails;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Invalid or expired promo code'
      );
    }
  }
);

// Launch Promtion Campaign (SMA/Email)
export const launchPromotionCampaign = createAsyncThunk(
  'promotions/launchCampaign',
  async (promotionId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/promotions/${promotionId}/launch`);
      return response.data.message;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to launch campaign'
      );
    }
  }
);