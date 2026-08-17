import { createSelector } from '@reduxjs/toolkit';

// Base Selector - Access the root customers state
export const selectCustomersState = (state) => state.customers;

// Basic Data Selectors
export const selectAllCustomers = createSelector(
  [selectCustomersState],
  (customers) => customers.list || []
);

export const selectCustomersLoading = createSelector(
  [selectCustomersState],
  (customers) => customers.loading
);

export const selectCustomersError = createSelector(
  [selectCustomersState],
  (customers) => customers.error
);

export const selectSelectedCustomer = createSelector(
  [selectCustomersState],
  (customers) => customers.selectedCustomer
);

// Metadata Selectors
export const selectCustomerTotalCount = createSelector(
  [selectCustomersState],
  (customers) => customers.totalCount || 0
);

export const selectCustomerSuccessMessage = createSelector(
  [selectCustomersState],
  (customers) => customers.successMessage
);

// AI-Driven & Business Logic Selectors
// Filters for VIPs or Loyal customers
export const selectLoyalCustomers = createSelector(
  [selectAllCustomers],
  (customers) => customers.filter((c) => (c.loyaltyPoints || 0) >= 500)
);

// Segments customers by Tier (New, Loyal, VIP)
export const selectCustomersByTier = (tier) =>
  createSelector([selectAllCustomers], (customers) =>
    customers.filter((c) => c.tier === tier)
  );

// Advanced Search Selector
// This handles the real-time search logic efficiently
export const selectFilteredCustomers = (searchTerm) =>
  createSelector([selectAllCustomers], (customers) => {
    if (!searchTerm?.trim()) return customers;

    const term = searchTerm.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.includes(term)
    );
  });

// Statistics (Useful for Dashboard Widgets)
export const selectCustomerStats = createSelector(
  [selectAllCustomers],
  (customers) => {
    return {
      total: customers.length,
      active: customers.filter(c => c.isActive !== false).length,
      blocked: customers.filter(c => c.isActive === false).length,
      // Added AI segment stats
      vips: customers.filter(c => c.segment === 'VIP').length,
      atRisk: customers.filter(c => c.segment === 'At-Risk').length,
      totalLoyaltyPoints: customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0)
    };
  }
);