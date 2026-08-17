import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

/**
 * Helper to normalize review responses across different endpoints.
 * Ensures that if the backend returns 'data' or 'reviews', the state 
 * always receives a consistent object.
 */
const normalizeReviewResponse = (response) => {
  const { data } = response;
  return {
    reviews: data.reviews || [],
    totalCount: data.totalCount || 0,
    page: data.page || 1,
    pageSize: data.pageSize || 20,
    stats: {
      totalReviews: data.stats?.totalReviews || 0,
      averageRating: data.stats?.averageRating || "0.0",
      pendingReplies: data.stats?.pendingReplies || 0,
      flagged: data.stats?.flagged || 0,
    },
  };
};

// Fetch Paginated & Filtered Reviews
export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/reviews', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search || '',
          rating: params.rating !== 'all' ? params.rating : undefined,
          status: params.status !== 'all' ? params.status : undefined,
          sortBy: params.sortBy || 'createdAt',
          sortOrder: params.sortOrder || 'desc',
        },
      });
      return normalizeReviewResponse(response);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load reviews'
      );
    }
  }
);

// Get Single Review Details
export const fetchReviewById = createAsyncThunk(
  'reviews/fetchReviewById',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/${reviewId}`);
      return response.data.review || response.data; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Review not found');
    }
  }
);

// Post a Reply to a Review
export const replyToReview = createAsyncThunk(
  'reviews/replyToReview',
  async ({ reviewId, replyText }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/reply`, {
        replyText,
      });
      return response.data.review || response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to post reply'
      );
    }
  }
);

// Toggle Flag Status
export const toggleReviewFlag = createAsyncThunk(
  'reviews/toggleFlag',
  async ({ reviewId, isFlagged }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/reviews/${reviewId}/flag`, { 
        isFlagged 
      });
      return response.data.review || response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update flag status'
      );
    }
  }
);

// Delete Review (Admin Only)
export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      return reviewId; 
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete review'
      );
    }
  }
);

// Bulk Action: Mark as Resolved/Helpful
export const markReviewHelpful = createAsyncThunk(
  'reviews/markHelpful',
  async ({ reviewId, helpful = true }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`, { 
        helpful 
      });
      return response.data.review || response.data;
    } catch (err) {
      return rejectWithValue('Failed to update review feedback');
    }
  }
);

// Trigger AI Sentiment Analysis
export const analyzeReviewSentiment = createAsyncThunk(
  'reviews/analyzeSentiment',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews/analyze-sentiment');
      return response.data; 
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'AI Service is currently unavailable'
      );
    }
  }
);