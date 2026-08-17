import { createSelector } from '@reduxjs/toolkit';

// Base Selector
export const selectPromotionsState = (state) => state.promotions;

// Direct Data Selectors
export const selectAllPromotions = createSelector(
  [selectPromotionsState],
  (promotions) => promotions.list || []
);

export const selectPromotionsLoading = createSelector(
  [selectPromotionsState],
  (promotions) => promotions.loading
);

export const selectPromotionsError = createSelector(
  [selectPromotionsState],
  (promotions) => promotions.error
);

export const selectPromotionsSuccessMessage = createSelector(
  [selectPromotionsState],
  (promotions) => promotions.successMessage
);

export const selectSelectedPromotion = createSelector(
  [selectPromotionsState],
  (promotions) => promotions.selectedPromotion
);

// Status-Based Selectors
export const selectActivePromotions = createSelector(
  [selectAllPromotions],
  (promotions) => promotions.filter(p => 
    p.isActive && (!p.endDate || new Date(p.endDate) > new Date())
  )
);

export const selectExpiredPromotions = createSelector(
  [selectAllPromotions],
  (promotions) => promotions.filter(p => 
    p.endDate && new Date(p.endDate) < new Date()
  )
);

// KPI & Analytic Selectors
export const selectTotalDiscountApplied = createSelector(
  [selectAllPromotions],
  (promotions) => promotions.reduce((sum, p) => sum + (p.totalDiscountApplied || 0), 0)
);

export const selectExpiringSoonCount = createSelector(
  [selectAllPromotions],
  (promotions) => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const now = new Date();

    return promotions.filter(p => {
      if (!p.endDate || !p.isActive) return false;
      const expiry = new Date(p.endDate);
      return expiry > now && expiry <= sevenDaysFromNow;
    }).length;
  }
);

// Dynamic Filter Selector (Used for the Search Bar and Dropdown)
export const selectFilteredPromotions = createSelector(
  [
    selectAllPromotions,
    (state, searchTerm) => searchTerm,
    (state, searchTerm, statusFilter) => statusFilter
  ],
  (promotions, searchTerm, statusFilter) => {
    return promotions.filter((promo) => {
      const matchesSearch =
        !searchTerm ||
        promo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.code?.toLowerCase().includes(searchTerm.toLowerCase());

      const isExpired = promo.endDate && new Date(promo.endDate) < new Date();
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && promo.isActive && !isExpired) ||
        (statusFilter === 'inactive' && !promo.isActive) ||
        (statusFilter === 'expired' && isExpired);

      return matchesSearch && matchesStatus;
    });
  }
);

// Summary Statistics Object
export const selectPromotionStats = createSelector(
  [selectAllPromotions, selectActivePromotions, selectExpiringSoonCount, selectTotalDiscountApplied],
  (all, active, expiringSoon, totalDiscount) => ({
    total: all.length,
    active: active.length,
    expiringSoon,
    totalDiscountValue: totalDiscount
  })
);