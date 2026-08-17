import { createSelector } from '@reduxjs/toolkit';

// Base selector - gets the entire registration slice
export const selectRegistrationState = (state) => state.registration;

// Step Selector
// Used to tell the UI which step of the wizard to display
export const selectRegistrationStep = createSelector(
  [selectRegistrationState],
  (registration) => registration.currentStep
);

// Loading & Status Selectors
export const selectIsRegistering = createSelector(
  [selectRegistrationState],
  (registration) => registration.loading
);

export const selectRegistrationError = createSelector(
  [selectRegistrationState],
  (registration) => registration.error
);

export const selectRegistrationSuccess = createSelector(
  [selectRegistrationState],
  (registration) => registration.successMessage
);

// Validation Selectors (For Step 1)
// Combines availability and checking state for the UI feedback
export const selectNameAvailability = createSelector(
  [selectRegistrationState],
  (registration) => ({
    isAvailable: registration.isNameAvailable,
    isChecking: registration.isCheckingName
  })
);

// Derived Selector (Optional)
// Returns true if the user is on the final step
export const selectIsLastStep = createSelector(
  [selectRegistrationStep],
  (step) => step === 4
);


const registrationSelectors = {
  selectRegistrationStep,
  selectIsRegistering,
  selectRegistrationError,
  selectRegistrationSuccess,
  selectNameAvailability,
  selectIsLastStep
};

export default registrationSelectors;