import { createSlice } from '@reduxjs/toolkit';
import {
  fetchCustomers,
  fetchCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  updateLoyaltyPoints,
  triggerSegmentation
} from './customerThunks';

const initialState = {
  list: [],               
  selectedCustomer: null, 
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  filters: {
    search: '',
    status: 'all',
  }
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearCustomerStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setCustomerFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // ALL SPECIFIC CASES GO FIRST
      
      // Fetch All
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.customers || [];
        state.totalCount = action.payload.totalCount || 0;
        state.currentPage = action.payload.page || 1;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Single
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.selectedCustomer = action.payload;
      })

      // Create
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.successMessage = 'Customer registered successfully';
      })

      // Delete 
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.list = state.list.filter(c => (c._id || c.id) !== action.payload);
        state.successMessage = 'Customer removed from database';
      })

      // AI Segmentaion
      .addCase(triggerSegmentation.pending, (state) => {
        state.loading = true; 
      })
      .addCase(triggerSegmentation.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = 'AI Customer Segmentation Successful!';
       
      })
      .addCase(triggerSegmentation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // ALL MATCHERS GO LAST 

      .addMatcher(
        (action) => [
          updateCustomer.fulfilled.type,
          toggleCustomerStatus.fulfilled.type,
          updateLoyaltyPoints.fulfilled.type
        ].includes(action.type),
        (state, action) => {
          const updatedItem = action.payload;
          const index = state.list.findIndex(c => (c._id || c.id) === (updatedItem._id || updatedItem.id));
          
          if (index !== -1) {
            state.list[index] = updatedItem;
          }
          
          if (state.selectedCustomer && (state.selectedCustomer._id === updatedItem._id)) {
            state.selectedCustomer = updatedItem;
          }
          
          state.successMessage = action.type.includes('loyalty') 
            ? 'Loyalty points updated' 
            : 'Customer record updated';
        }
      );
  },
});



export const { 
  clearCustomerStatus, 
  setCustomerFilters, 
  resetSelectedCustomer 
} = customerSlice.actions;

export default customerSlice.reducer;