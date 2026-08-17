import { createSelector } from '@reduxjs/toolkit';

// Base Selector
export const selectReviewsState = (state) => state.reviews;

// Direct Data Selectors
export const selectAllReviews = createSelector(
  [selectReviewsState],
  (reviews) => reviews.list || []
);

export const selectReviewsLoading = createSelector(
  [selectReviewsState],
  (reviews) => reviews.loading
);

export const selectReviewsError = createSelector(
  [selectReviewsState],
  (reviews) => reviews.error
);

export const selectReviewsSuccessMessage = createSelector(
  [selectReviewsState],
  (reviews) => reviews.successMessage
);

export const selectSelectedReview = createSelector(
  [selectReviewsState],
  (reviews) => reviews.selectedReview
);

// KPI & Analytics Selectors
export const selectReviewStats = createSelector(
  [selectReviewsState],
  (reviews) => reviews.stats || {
    totalReviews: 0,
    averageRating: 0,
    pendingReplies: 0,
    flagged: 0
  }
);

export const selectAverageRating = createSelector(
  [selectReviewStats],
  (stats) => {
    const avg = stats?.averageRating;
    if (avg === undefined || avg === null) return '0.0';
    return typeof avg === 'number' ? avg.toFixed(1) : avg;
  }
);

// Response Rate Selector
export const selectResponseRate = createSelector(
  [selectAllReviews],
  (reviews) => {
    if (reviews.length === 0) return 0;
    const replied = reviews.filter(r => !!r.repliedAt).length;
    return Math.round((replied / reviews.length) * 100);
  }
);

// Memoized Filtered Selector
export const selectFilteredReviews = createSelector(
  [
    selectAllReviews,
    (state, searchTerm) => searchTerm,
    (state, searchTerm, ratingFilter) => ratingFilter,
    (state, searchTerm, ratingFilter, statusFilter) => statusFilter,
  ],
  (reviews, searchTerm, ratingFilter, statusFilter) => {
    const term = searchTerm?.toLowerCase();

    return reviews.filter((review) => {
      const matchesFoodName = review.foodAnalysis?.some(item => 
        item.foodName.toLowerCase().includes(term)
      );

      const matchesSearch =
        !term ||
        review.customer?.name?.toLowerCase().includes(term) || 
        review.feedback?.toLowerCase().includes(term) ||      
        review.orderId?.toLowerCase().includes(term) ||
        matchesFoodName; 

      // Rating Filter 
      const matchesRating =
        ratingFilter === 'all' || 
        review.rating === Number(ratingFilter);

      // Status Filter 
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'flagged' && review.isFlagged) ||
        (statusFilter === 'replied' && !!review.repliedAt) ||
        (statusFilter === 'pending' && !review.repliedAt);

      return matchesSearch && matchesRating && matchesStatus;
    });
  }
);

// Sentiment Analytics Selector
export const selectPositiveSentimentRate = createSelector(
  [selectAllReviews],
  (reviews) => {
    const analyzed = reviews.filter(r => r.sentimentLabel && r.sentimentLabel !== 'Not Analyzed');
    if (analyzed.length === 0) return 0;
    
    const positive = analyzed.filter(r => r.sentimentLabel === 'Positive').length;
    return Math.round((positive / analyzed.length) * 100);
  }
);

export const selectPagination = createSelector(
  [selectReviewsState],
  (reviews) => ({
    currentPage: reviews.currentPage || 1,
    pageSize: reviews.pageSize || 20,
    totalCount: reviews.totalCount || 0,
    totalPages: Math.max(1, Math.ceil((reviews.totalCount || 0) / (reviews.pageSize || 20))),
  })
);