import { createSlice } from '@reduxjs/toolkit';
import { submitInitialForm, fetchCustomerByPhone } from './authThunks';

const savedCustomer = JSON.parse(localStorage.getItem('customer') || 'null');

const initialState = {
  restaurantId: localStorage.getItem('restaurantId') || null,
  tableId: localStorage.getItem('tableId') || null,
  name: savedCustomer?.name || '',
  phone: savedCustomer?.phone || '',
  email: savedCustomer?.email || '',
  dateOfBirth: savedCustomer?.dateOfBirth || null,
  address: savedCustomer?.homeAddress || savedCustomer?.address || null,
  customerHomeRestaurantId: savedCustomer?.restaurantId || null,
  isAuthenticated: !!savedCustomer,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { name, phone, email, dateOfBirth, homeAddress, address, restaurantId } = action.payload;
      state.name = name;
      state.phone = phone;
      state.email = email || '';
      state.dateOfBirth = dateOfBirth || null;
      state.address = homeAddress || address || null;
      state.isAuthenticated = true;
      if (restaurantId) state.customerHomeRestaurantId = restaurantId;

      localStorage.setItem('customer', JSON.stringify(action.payload));
    },
    setTableId: (state, action) => {
      state.tableId = action.payload;
      localStorage.setItem('tableId', action.payload);
    },
    setRestaurantId: (state, action) => {
      const newRestaurantId = action.payload;
      if (
        state.customerHomeRestaurantId &&
        newRestaurantId &&
        state.customerHomeRestaurantId !== newRestaurantId
      ) {
        state.isAuthenticated = false;
        state.name = '';
        state.phone = '';
        state.email = '';
        state.dateOfBirth = null;
        state.address = null;
        state.customerHomeRestaurantId = null;
        localStorage.removeItem('customer');
      }

      state.restaurantId = newRestaurantId;
      localStorage.setItem('restaurantId', newRestaurantId);
    },
    logout: (state) => {
      localStorage.clear();
      localStorage.removeItem('customer');
      state.name = '';
      state.phone = '';
      state.email = '';
      state.dateOfBirth = null;
      state.address = null;
      state.customerHomeRestaurantId = null;
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
      .addCase(submitInitialForm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitInitialForm.fulfilled, (state, action) => {
        const { name, phone, email, dateOfBirth, homeAddress, restaurantId } = action.payload.customer;

        state.loading = false;
        state.isAuthenticated = true;
        state.name = name;
        state.phone = phone;
        state.email = email || '';
        state.dateOfBirth = dateOfBirth || null;
        state.address = homeAddress || null;
        state.customerHomeRestaurantId = restaurantId || state.restaurantId;

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
        const { name, phone, email, dateOfBirth, homeAddress, restaurantId } = action.payload.customer;

        state.loading = false;
        state.isAuthenticated = true;
        state.name = name;
        state.phone = phone;
        state.email = email || '';
        state.dateOfBirth = dateOfBirth || null;
        state.address = homeAddress || null;
        state.customerHomeRestaurantId = restaurantId || state.restaurantId;

        localStorage.setItem('customer', JSON.stringify(action.payload.customer));
      })
      .addCase(fetchCustomerByPhone.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setCredentials,
  setTableId,
  setRestaurantId,
  logout,
  clearAuthError,
  updateCustomerEmail,
  updateCustomerDOB,
} = authSlice.actions;

export default authSlice.reducer;