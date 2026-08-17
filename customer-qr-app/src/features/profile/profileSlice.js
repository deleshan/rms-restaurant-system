import { createSlice } from '@reduxjs/toolkit';
import { 
  fetchProfile, 
  updateProfile, 
  fetchLoyalty, 
  fetchActiveOffers 
} from './profileThunks';

const initialState = {
  profile: {
    name: '',
    phone: '',
    email: '',
    dateOfBirth: null,
    address: '',
  },
  loyaltyPoints: 0,
  tier: 'Regular',
  activeOffers: [],
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Manually set profile (e.g., when first filling the table/name form)
    setProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    // Clear profile on logout
    clearProfile: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      /**
       * FETCH PROFILE
       */
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Merge existing local data with backend data
        state.profile = { ...state.profile, ...action.payload };
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * UPDATE PROFILE
       */
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = { ...state.profile, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /**
       * FETCH LOYALTY
       */
      .addCase(fetchLoyalty.fulfilled, (state, action) => {
        const { points, tier } = action.payload;
        state.loyaltyPoints = points || 0;
        state.tier = tier || 'Regular';
      })

      /**
       * FETCH OFFERS
       */
      .addCase(fetchActiveOffers.fulfilled, (state, action) => {
        state.activeOffers = action.payload || [];
      });
  },
});

export const { setProfile, clearProfile } = profileSlice.actions;

export default profileSlice.reducer;