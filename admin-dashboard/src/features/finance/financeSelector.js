import { createSelector } from '@reduxjs/toolkit';

/**
 * BASE SELECTOR
 * Access the raw finance slice from the root state
 */
export const selectFinanceState = (state) => state.finance;


/**
 * CORE DATA SELECTORS
 */
export const selectFinanceOverview = createSelector(
  [selectFinanceState],
  (finance) => finance.overview || {}
);

/**
 * Initialization Status Selector
 * Used by FinancePage to decide whether to show the "Initial Balance" banner
 */
export const selectIsFinanceInitialized = createSelector(
  [selectFinanceOverview],
  (overview) => overview.isInitialized ?? false
);

export const selectSalesReport = createSelector(
  [selectFinanceState],
  (finance) => finance.salesReport || {}
);

export const selectPnLReport = createSelector(
  [selectFinanceState],
  (finance) => finance.pnlReport || {}
);

export const selectBalanceSheet = createSelector(
  [selectFinanceState],
  (finance) => finance.balanceSheet || {}
);

export const selectCashFlow = createSelector(
  [selectFinanceState],
  (finance) => finance.cashFlow || {}
);

export const selectExpenditures = createSelector(
  [selectFinanceState],
  (finance) => finance.expenditures || []
);

export const selectAssets = createSelector(
  [selectFinanceState],
  (finance) => finance.assets || []
);


/**
 * UI & META SELECTORS
 */
export const selectFinanceLoading = createSelector(
  [selectFinanceState],
  (finance) => finance.loading || false
);

export const selectFinanceError = createSelector(
  [selectFinanceState],
  (finance) => finance.error || null
);

export const selectFinanceSuccessMessage = createSelector(
  [selectFinanceState],
  (finance) => finance.successMessage || null
);

export const selectFinanceLastUpdated = createSelector(
  [selectFinanceState],
  (finance) => finance.lastUpdated
);


/**
 * DERIVED ANALYTICAL SELECTORS (Business Logic)
 */

/**
 * Formats Sales Trend Data for Charts
 */
export const selectSalesChartData = createSelector(
  [selectSalesReport],
  (report) => ({
    labels: report?.dailySales?.map(d => d.date) || [],
    revenue: report?.dailySales?.map(d => d.revenue) || [],
    orders: report?.dailySales?.map(d => d.orders) || []
  })
);

/**
 * P&L Metrics with Fallbacks
 * Calculates Gross Profit and Net Margin
 */
export const selectPnLMetrics = createSelector(
  [selectPnLReport],
  (pnl) => {
    const revenue = pnl?.totalRevenue || 0;
    const cogs = pnl?.cogs || 0;
    const netProfit = pnl?.totalNetProfit || 0;

    return {
      grossProfit: pnl?.grossProfit || 0,
      grossMargin: revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0,
      netMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
      totalExpenses: pnl?.totalExpenses || 0
    };
  }
);


/**
 * Restaurant Specific: Prime Cost Selector
 * Prime Cost = (Cost of Goods Sold + Total Labor Costs)
 */
export const selectPrimeCost = createSelector(
  [selectPnLReport],
  (pnl) => {
    const cogs = pnl?.cogs || 0;
    const labor = pnl?.expensesStaff || 0;
    const revenue = pnl?.totalRevenue || 0;
    const primeCostValue = cogs + labor;

    return {
      value: primeCostValue,
      percentage: revenue > 0 ? (primeCostValue / revenue) * 100 : 0
    };
  }
);

/**
 * Cash Runway Selector
 * Estimates how many months of operations the current cash can cover
 */
export const selectCashRunway = createSelector(
  [selectCashFlow, selectPnLReport],
  (cf, pnl) => {
    const currentBalance = cf?.closingBalance || 0;
    
    let monthlyBurn = 0;
    
    if (pnl?.monthly?.length > 0) {
      const totalPeriodExpenses = pnl.monthly.reduce((sum, m) => sum + (m.totalExpenses || 0), 0);
      monthlyBurn = totalPeriodExpenses / pnl.monthly.length;
    } else {
      monthlyBurn = pnl?.totalExpenses || 0;
    }

    if (monthlyBurn <= 0) return null; 

    const runwayMonths = currentBalance / monthlyBurn;
    return Number(runwayMonths.toFixed(1));
  }
);

// Sum of annual depreciation across all active depreciable assets
export const selectTotalAnnualDepreciation = createSelector(
  [selectAssets],
  (assets) =>
    assets
      .filter((a) => a.status === 'Active' && a.assetType !== 'Land')
      .reduce((sum, a) => {
        const life = a.usefulLife || 5;
        const rate = a.depreciationMethod === 'declining-balance'
          ? (a.currentValue || a.purchaseCost) * (2 / life)
          : a.purchaseCost / life;
        return sum + rate;
      }, 0)
);

export const selectIsSubmitting = createSelector(
  [selectFinanceState],
  (finance) => finance.isSubmitting || false
);

export const selectCapitalState = createSelector(
  [selectFinanceState],
  (finance) => finance.capital || { transactions: [], totals: {} }
);

export const selectCapitalTransactions = createSelector(
  [selectCapitalState],
  (capital) => capital.transactions || []
);

export const selectCapitalTotals = createSelector(
  [selectCapitalState],
  (capital) => capital.totals || { activeLoans: 0, externalInvestmentsIn: 0, externalInvestmentsOut: 0, netOwnerEquity: 0 }
);

/**
 * Advanced Derived KPI: Financial Leverage Ratio
 * Essential for your restaurant's Balance Sheet evaluation rules
 */
export const selectDebtToEquityRatio = createSelector(
  [selectCapitalTotals],
  (totals) => {
    const totalDebt = totals.activeLoans || 0;
    const equity = totals.netOwnerEquity || 0;
    if (equity <= 0) return totalDebt > 0 ? 'High Leverage' : '0.00';
    return (totalDebt / equity).toFixed(2);
  }
);

export const selectActiveLoans = createSelector(
  [selectCapitalState],
  (capital) => capital.activeLoans || []
);

export const selectAllLoans = createSelector(
  [selectCapitalState],
  (capital) => capital.allLoans || []
);


export const financeSelectors = {
  selectFinanceState,
  selectFinanceOverview,
  selectIsFinanceInitialized,
  selectSalesReport,
  selectPnLReport,
  selectBalanceSheet,
  selectCashFlow,
  selectExpenditures,
  selectAssets,
  selectFinanceLoading,
  selectFinanceError,
  selectFinanceSuccessMessage,
  selectFinanceLastUpdated,
  selectSalesChartData,
  selectPnLMetrics,
  selectPrimeCost,
  selectCashRunway,
  selectTotalAnnualDepreciation,
  selectIsSubmitting,
  selectCapitalState,
  selectCapitalTransactions,
  selectCapitalTotals,
  selectDebtToEquityRatio,
  selectActiveLoans,
  selectAllLoans,
};

export default financeSelectors;