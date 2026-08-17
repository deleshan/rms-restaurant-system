import { createSlice } from '@reduxjs/toolkit';
import { submitInitialForm, fetchCustomerByPhone } from './authThunks';


const savedCustomer = JSON.parse(localStorage.getItem('customer') || 'null');

const initialState = {
  restaurantId: localStorage.getItem('restaurantId') || null,
  tableId: localStorage.getItem('tableId') || null,
  // User Data
  name: savedCustomer?.name || '',
  phone: savedCustomer?.phone || '',
  email: savedCustomer?.email || '',
  dateOfBirth: savedCustomer?.dateOfBirth || null,
  address: savedCustomer?.homeAddress || savedCustomer?.address || null,
  // UI State
  isAuthenticated: !!savedCustomer,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { name, phone, email, dateOfBirth, homeAddress, address } = action.payload;
      state.name = name;
      state.phone = phone;
      state.email = email || '';
      state.dateOfBirth = dateOfBirth || null;
      state.address = homeAddress || address || null;
      state.isAuthenticated = true;
      
      localStorage.setItem('customer', JSON.stringify(action.payload));
    },
    setTableId: (state, action) => {
      state.tableId = action.payload;
      localStorage.setItem('tableId', action.payload);
    },
    setRestaurantId: (state, action) => {
      state.restaurantId = action.payload;
      localStorage.setItem('restaurantId', action.payload);
    },
    logout: (state) => {
      localStorage.clear();
      localStorage.removeItem('customer');
      state.name = '';
      state.phone = '';
      state.email = '';
      state.dateOfBirth = null;
      state.address = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    updateCustomerEmail: (state, action) => {
      state.email = action.payload;
      const saved = JSON.parse(localStorage.getItem('customer') || '{}');
      saved.email = action.payload;
      localStorage.setItem('customer', JSON.stringify(saved));
    },
    updateCustomerDOB: (state, action) => {
      state.dateOfBirth = action.payload;
      const saved = JSON.parse(localStorage.getItem('customer') || '{}');
      saved.dateOfBirth = action.payload;
      localStorage.setItem('customer', JSON.stringify(saved));
    },
  },
  extraReducers: (builder) => {
    builder
      
      //Handle submitInitialForm (Registration/Login)
      .addCase(submitInitialForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitInitialForm.fulfilled, (state, action) => {
        const { name, phone, email, dateOfBirth, homeAddress } = action.payload.customer;
        
        state.loading = false;
        state.isAuthenticated = true;
        state.name = name;
        state.phone = phone;
        state.email = email || '';
        state.dateOfBirth = dateOfBirth || null;
        state.address = homeAddress || null; 
        
        localStorage.setItem('customer', JSON.stringify(action.payload.customer));
      })
      .addCase(submitInitialForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Authentication failed'; 
      })

      .addCase(fetchCustomerByPhone.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomerByPhone.fulfilled, (state, action) => {
        const { name, phone, email, dateOfBirth, homeAddress } = action.payload.customer;
        
        state.loading = false;
        state.isAuthenticated = true;
        state.name = name;
        state.phone = phone;
        state.email = email || '';
        state.dateOfBirth = dateOfBirth || null;
        state.address = homeAddress || null;
        
        localStorage.setItem('customer', JSON.stringify(action.payload.customer));
      })
      .addCase(fetchCustomerByPhone.rejected, (state) => {
        state.loading = false;
      })

  },
});

export const { 
  setCredentials,
  setTableId, 
  setRestaurantId, 
  logout, 
  clearAuthError,
  updateCustomerEmail,
  updateCustomerDOB
} = authSlice.actions;

export default authSlice.reducer;