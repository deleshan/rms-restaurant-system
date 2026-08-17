import { createSlice } from '@reduxjs/toolkit';
import {
  fetchPromotions,
  fetchPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  launchPromotionCampaign
} from './promotionThunks';

const initialState = {
  list: [],
  selectedPromotion: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
};

const promotionSlice = createSlice({
  name: 'promotions',
  initialState,
  reducers: {
    clearPromotionStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearPromotionSuccess: (state) => {
      state.successMessage = null;
    },
    resetSelectedPromotion: (state) => {
      state.selectedPromotion = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // PROMISES: PENDING 
      .addCase(fetchPromotions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // PROMISES: FULFILLED (Specific Cases) 
      
      // Fetch All
      .addCase(fetchPromotions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.promotions || [];
        state.totalCount = action.payload.totalCount || 0;
        state.currentPage = action.payload.page || 1;
      })

      // Fetch Single
      .addCase(fetchPromotionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPromotion = action.payload;
      })

      // Create
      .addCase(createPromotion.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.totalCount += 1;
        state.successMessage = 'Promotion created successfully!';
      })

      // Delete
      .addCase(deletePromotion.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter(p => (p._id || p.id) !== action.payload);
        state.totalCount -= 1;
        state.successMessage = 'Promotion removed successfully';
      })

      .addCase(launchPromotionCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })

      // MATCHERS (General Logic for Multiple Thunks) 

      // Update & Toggle Success Handler
      .addMatcher(
        (action) => [updatePromotion.fulfilled.type, togglePromotionStatus.fulfilled.type].includes(action.type),
        (state, action) => {
          const updatedItem = action.payload;
          const index = state.list.findIndex(p => (p._id || p.id) === (updatedItem._id || updatedItem.id));
          
          if (index !== -1) {
            state.list[index] = updatedItem;
          }
          
          if (state.selectedPromotion && (state.selectedPromotion._id === updatedItem._id)) {
            state.selectedPromotion = updatedItem;
          }

          state.successMessage = action.type.includes('toggleStatus') 
            ? `Promotion ${updatedItem.isActive ? 'activated' : 'deactivated'}`
            : 'Promotion updated successfully';
          state.loading = false;
        }
      )

      // Global Rejection Handler (Any thunk that fails)
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || 'An unexpected error occurred';
        }
      );
  },
});


export const { 
  clearPromotionStatus, 
  clearPromotionSuccess, 
  resetSelectedPromotion ,
} = promotionSlice.actions;


export * from './promotionThunks'; 
export default promotionSlice.reducer;