import { createSlice } from '@reduxjs/toolkit';
import { submitReview } from './reviewThunks';

const initialState = {
  ratings: {},           
  serviceRating: 0,      
  feedback: '',          
  billingPreference: null, // 'email' | 'sms' | 'print'
  photos: [],            
  submitting: false,
  success: false,
  error: null,
};

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    // Set rating for a specific food item
    setFoodRating: (state, action) => {
      const { itemId, rating } = action.payload;
      state.ratings[itemId] = rating;
    },

    // Set overall service rating
    setServiceRating: (state, action) => {
      state.serviceRating = action.payload;
    },

    // Set general feedback text
    setFeedback: (state, action) => {
      state.feedback = action.payload;
    },

    // Set how the user wants their bill
    setBillingPreference: (state, action) => {
      state.billingPreference = action.payload;
    },

    // Add photo (URL or temp file)
    addReviewPhoto: (state, action) => {
      state.photos.push(action.payload);
    },

    // Remove a photo
    removeReviewPhoto: (state, action) => {
      state.photos = state.photos.filter((_, index) => index !== action.payload);
    },

    // Reset entire review state (Manually used if user cancels)
    resetReview: (state) => {
      return initialState;
    },
  },
  // ExtraReducers handle the lifecycle of the async thunk automatically
  extraReducers: (builder) => {
    builder
      // While the review is being sent to the server
      .addCase(submitReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.success = false;
      })
      // When the review is successfully saved on the server
      .addCase(submitReview.fulfilled, (state) => {
        state.submitting = false;
        state.success = true;
        state.error = null;
        
        // Form is cleared ONLY after success
        state.ratings = {};
        state.serviceRating = 0;
        state.feedback = '';
        state.billingPreference = null;
        state.photos = [];
      })
      // If the server returns an error
      .addCase(submitReview.rejected, (state, action) => {
        state.submitting = false;
        state.success = false;
        state.error = action.payload || 'Failed to submit review';
      });
  },
});

export const {
  setFoodRating,
  setServiceRating,
  setFeedback,
  setBillingPreference,
  addReviewPhoto,
  removeReviewPhoto,
  resetReview,
} = reviewSlice.actions;

export default reviewSlice.reducer;