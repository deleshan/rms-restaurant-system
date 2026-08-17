import { createSlice } from '@reduxjs/toolkit';
import {
  fetchReviews,
  fetchReviewById,
  replyToReview,
  toggleReviewFlag,
  deleteReview,
  analyzeReviewSentiment,
} from './reviewThunks';

const initialState = {
  list: [],
  selectedReview: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  stats: {
    totalReviews: 0,
    averageRating: "0.0",
    pendingReplies: 0,
    flagged: 0,
  },
};

/**
 * HELPER: Recalculate stats based on current local list
 * This keeps the KPI cards in sync during user actions
 */
const calculateStats = (state) => {
  const list = state.list;
  
  const flagged = list.filter(r => r.isFlagged).length;
  const pending = list.filter(r => !r.repliedAt).length;
  const avg = list.length > 0 
    ? (list.reduce((sum, r) => sum + (r.rating || 0), 0) / list.length).toFixed(1)
    : "0.0";

  return {
    totalReviews: state.totalCount,
    averageRating: avg,
    pendingReplies: pending,
    flagged: flagged,
  };
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewSuccess: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    resetSelectedReview: (state) => {
      state.selectedReview = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Reviews
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.reviews || [];
        state.totalCount = action.payload.totalCount || 0;
        state.currentPage = action.payload.page || 1;
        state.pageSize = action.payload.pageSize || 20;
        state.stats = action.payload.stats || initialState.stats;
      })

      // Fetch Single Review
      .addCase(fetchReviewById.fulfilled, (state, action) => {
        state.selectedReview = action.payload;
      })

      // Delete Review 
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.list = state.list.filter(r => (r._id || r.id) !== action.payload);
        state.totalCount -= 1;
        state.stats = calculateStats(state); // Update stats after deletion
        state.successMessage = 'Review removed permanently';
      })

      // AI Sentiment Analysis 
      .addCase(analyzeReviewSentiment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeReviewSentiment.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = 'AI Analysis complete! Refreshing insights...';
      })
      .addCase(analyzeReviewSentiment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SUCCESS MATCHERS (Reply & Flag) 
      .addMatcher(
        (action) => [replyToReview.fulfilled.type, toggleReviewFlag.fulfilled.type].includes(action.type),
        (state, action) => {
          const updatedReview = action.payload;
          const index = state.list.findIndex(r => (r._id || r.id) === (updatedReview._id || updatedReview.id));
          
          if (index !== -1) {
            state.list[index] = updatedReview;
          }

          if (state.selectedReview && (state.selectedReview._id === updatedReview._id)) {
            state.selectedReview = updatedReview;
          }

          state.stats = calculateStats(state);

          state.successMessage = action.type.includes('replyToReview') 
            ? 'Response sent to customer' 
            : `Review marked as ${updatedReview.isFlagged ? 'flagged' : 'resolved'}`;
          state.loading = false;
        }
      )

      // GLOBAL REJECTION HANDLER
      .addMatcher(
        (action) => action.type.endsWith('/rejected') && action.type.startsWith('reviews/'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || 'An unexpected error occurred';
        }
      );
  },
});

export const { 
  clearReviewSuccess, 
  resetSelectedReview 
} = reviewSlice.actions;

export default reviewSlice.reducer;