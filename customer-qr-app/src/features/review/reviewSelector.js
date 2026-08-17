import { createSelector } from '@reduxjs/toolkit';

// Base selector
const selectReview = (state) => state.review || {};

// All food ratings (object)
export const selectFoodRatings = createSelector(
  selectReview,
  (review) => review.ratings
);

// Overall service rating
export const selectServiceRating = createSelector(
  selectReview,
  (review) => review.serviceRating || 0
);

export const selectBillingPreference = createSelector(
  selectReview,
  (review) => review.billingPreference
);

// General feedback text
export const selectFeedback = createSelector(
  selectReview,
  (review) => review.feedback
);

// Uploaded photos
export const selectReviewPhotos = createSelector(
  selectReview,
  (review) => review.photos
);

// Submission states
export const selectReviewSubmitting = createSelector(
  selectReview,
  (review) => review.submitting
);

export const selectReviewSuccess = createSelector(
  selectReview,
  (review) => review.success
);

export const selectReviewError = createSelector(
  selectReview,
  (review) => review.error
);

// Combined selector for ReviewPage
export const selectReviewState = createSelector(
  selectFoodRatings,
  selectServiceRating,
  selectFeedback,
  selectReviewPhotos,
  selectReviewSubmitting,
  selectReviewSuccess,
  selectReviewError,
  selectBillingPreference, 
  (
    ratings, 
    serviceRating, 
    feedback, 
    photos, 
    submitting, 
    success, 
    error, 
    billingPreference 
  ) => ({
    ratings,
    serviceRating,
    feedback,
    photos,
    submitting,
    success,
    error,
    billingPreference, 
  })
);