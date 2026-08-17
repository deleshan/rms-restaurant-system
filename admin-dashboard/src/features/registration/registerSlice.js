import { createSlice } from '@reduxjs/toolkit';
import { registerBusiness, checkNameAvailability } from './registrationThunks';

const initialState = {
  currentStep: 1,
  loading: false,
  error: null,
  successMessage: null,
  isNameAvailable: true,
  isCheckingName: false,
};

const registerSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    // Navigate between wizard steps locally
    setStep: (state, action) => {
      state.currentStep = action.payload;
    },
    // Reset registration state if user leaves the page
    resetRegistration: (state) => {
      state.currentStep = 1;
      state.error = null;
      state.successMessage = null;
      state.loading = false;
    },
    clearRegistrationErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // SPECIFIC CASES 

      // CHECK NAME AVAILABILITY
      .addCase(checkNameAvailability.pending, (state) => {
        state.isCheckingName = true;
      })
      .addCase(checkNameAvailability.fulfilled, (state, action) => {
        state.isCheckingName = false;
        state.isNameAvailable = action.payload;
      })

      // REGISTER BUSINESS
      .addCase(registerBusiness.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerBusiness.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
        state.currentStep = 1;
      })
      .addCase(registerBusiness.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GLOBAL MATCHERS (ORDERED LAST)
      .addMatcher(
        (action) => action.type.endsWith('/rejected') && action.type.startsWith('registration/'),
        (state, action) => {
          state.loading = false;
          if (!state.error) {
            state.error = action.payload || 'An error occurred during registration';
          }
        }
      );
  },
});



export const { 
  setStep, 
  resetRegistration, 
  clearRegistrationErrors 
} = registerSlice.actions;


export const selectRegistrationStep = (state) => state.registration?.currentStep || 1;
export const selectIsRegistering = (state) => state.registration?.loading || false;
export const selectRegistrationError = (state) => state.registration?.error || null;

export const selectNameAvailability = (state) => ({
  available: state.registration?.isNameAvailable ?? true,
  checking: state.registration?.isCheckingName ?? false
});

export default registerSlice.reducer;