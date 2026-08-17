import { createSlice } from '@reduxjs/toolkit';
import { loginStaff, verifySession } from './authThunks';

const initialState = {
  token: localStorage.getItem('staff_token') || null,
  staff: JSON.parse(localStorage.getItem('staff_user') || 'null'),
  restaurantId: localStorage.getItem('restaurant_id') || null,
  role: null,
  station: localStorage.getItem('assigned_station') || 'Full Kitchen',
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('staff_token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setStation: (state, action) => {
      state.station = action.payload;
      localStorage.setItem('assigned_station', action.payload);
    },
    logoutStaff: (state) => {
      state.token = null;
      state.staff = null;
      state.restaurantId = null;
      state.role = null;
      state.isAuthenticated = false;
      localStorage.clear(); 
    },
    clearAuthError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      .addCase(loginStaff.fulfilled, (state, action) => {
        state.loading = false;
        const p = action.payload;
        const userData = p.user || p.data || p.staff || p;
        const restaurantId = p.restaurantId || userData?.restaurantId || userData?._id;

        state.token = p.token;
        state.staff = userData;
        state.restaurantId = restaurantId;
        state.role = p.role || 'kitchen';
        state.isAuthenticated = true;

        localStorage.setItem('staff_token', p.token);
        localStorage.setItem('restaurant_id', restaurantId);
        if (userData) localStorage.setItem('staff_user', JSON.stringify(userData));
      })
      .addCase(verifySession.fulfilled, (state, action) => {
        const p = action.payload;
        const userData = p.data || p;
        const restaurantId = p.restaurantId || userData?.restaurantId || userData?._id;

        state.staff = userData;
        state.restaurantId = restaurantId;
        state.role = p.role || userData?.role || 'kitchen';
        state.isAuthenticated = true;
      })
      .addCase(verifySession.rejected, (state) => {
        state.isAuthenticated = false;
        state.restaurantId = null;
        state.role = null;
        state.staff = null;
        state.token = null;
      });
  },
});

export const { setStation, logoutStaff, clearAuthError } = authSlice.actions;
export default authSlice.reducer;