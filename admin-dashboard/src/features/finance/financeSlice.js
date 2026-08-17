import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import {
  fetchFinanceOverview,
  fetchSalesReport,
  fetchPnLReport,
  fetchBalanceSheet,
  fetchCashFlow,
  fetchExpenditures,
  recordTransaction,
  fetchAssets,
  setInitialBalance,
  purchaseAsset, 
  sellAsset,
  fetchCapitalTransactions,
  createCapitalTransaction,
  fetchActiveLoans,
  updateExpense,
  fetchPendingPayments, 
  payBill
} from './financeThunks';

const initialState = {
  assets: [],
  overview: {
    isInitialized: false,
  },
  salesReport: {},
  pnlReport: {},
  balanceSheet: {},
  cashFlow: {},
  expenditures: [], 
  loading: false,
  capital: {
    transactions: [],
    totals: {
      activeLoans: 0,
      externalInvestmentsIn: 0,
      externalInvestmentsOut: 0,
      netOwnerEquity: 0
    },
    activeLoans: [],
    allLoans: [],
  },
  error: null,
  successMessage: null,
  lastUpdated: null,
  isSubmitting: false,
  
};

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    clearFinanceError: (state) => {
      state.error = null;
    },
    clearFinanceSuccess: (state) => {
      state.successMessage = null;
    },
    resetFinanceState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // SUCCESS HANDLERS (FULFILLED)
      .addCase(fetchFinanceOverview.fulfilled, (state, action) => {
        state.overview = action.payload;
      })
      .addCase(setInitialBalance.fulfilled, (state, action) => {
        state.successMessage = 'Initial balance established successfully';
        state.overview.isInitialized = true;
        if (action.payload.updatedOverview) {
          state.overview = action.payload.updatedOverview;
        }
      })
      .addCase(fetchCapitalTransactions.fulfilled, (state, action) => {
        state.capital.transactions = action.payload.transactions || [];
        state.capital.totals = action.payload.totals || initialState.capital.totals;
      })
      .addCase(createCapitalTransaction.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(createCapitalTransaction.fulfilled, (state) => {
        state.isSubmitting = false;
        state.successMessage = 'Capital transaction processed and finalized into ledger successfully';
      })
      .addCase(createCapitalTransaction.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.salesReport = action.payload;
      })
      .addCase(fetchPnLReport.fulfilled, (state, action) => {
        state.pnlReport = action.payload;
      })
      .addCase(fetchBalanceSheet.fulfilled, (state, action) => {
        state.balanceSheet = action.payload;
      })
      .addCase(fetchCashFlow.fulfilled, (state, action) => {
        state.cashFlow = action.payload;
      })
      .addCase(fetchExpenditures.fulfilled, (state, action) => {
        state.expenditures = action.payload;
      })
      
      .addCase(recordTransaction.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(updateExpense.pending, (state) => { state.isSubmitting = true; })
      .addCase(updateExpense.fulfilled, (state) => {
        state.isSubmitting = false;
        state.successMessage = 'Expense updated successfully';
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      .addCase(recordTransaction.fulfilled, (state) => {
        state.isSubmitting = false;
        state.successMessage = 'Transaction recorded successfully';
      })
      .addCase(recordTransaction.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.assets = action.payload;
      })
      .addCase(purchaseAsset.fulfilled, (state, action) => {
        state.successMessage = 'Asset purchased successfully';
        // Optimistically push the new asset so the table updates instantly
        if (action.payload?.data) {
          state.assets = [...state.assets, action.payload.data];
        }
      })
      .addCase(sellAsset.fulfilled, (state, action) => {
        state.successMessage = 'Asset sold and gain/loss recorded';
        // Update the sold asset's status in the list
        const updated = action.payload?.data;
        if (updated) {
          state.assets = state.assets.map((a) =>
            a._id === updated._id ? updated : a
          );
        }
      })
      .addCase(fetchActiveLoans.fulfilled, (state, action) => {
        state.capital.activeLoans = action.payload.activeLoans || [];
        state.capital.allLoans = action.payload.allLoans || [];
      })
      

      // PENDING MATCHER 
      .addMatcher(
        isAnyOf(
          fetchFinanceOverview.pending,
          fetchSalesReport.pending,
          fetchPnLReport.pending,
          fetchBalanceSheet.pending,
          fetchCashFlow.pending,
          fetchExpenditures.pending,
          recordTransaction.pending,
          fetchAssets.pending,
          setInitialBalance.pending,
          purchaseAsset.pending,
          sellAsset.pending,
          fetchCapitalTransactions.pending,
          createCapitalTransaction.pending
        ),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      
      // REJECTED MATCHER
      .addMatcher(
        isAnyOf(
          fetchFinanceOverview.rejected,
          fetchSalesReport.rejected,
          fetchPnLReport.rejected,
          fetchBalanceSheet.rejected,
          fetchCashFlow.rejected,
          fetchExpenditures.rejected,
          recordTransaction.rejected,
          fetchAssets.rejected,
          setInitialBalance.rejected,
          purchaseAsset.rejected,
          sellAsset.rejected,
          fetchCapitalTransactions.rejected,
          createCapitalTransaction.rejected
        ),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || 'An unexpected error occurred';
        }
      )

      // FULFILLED MATCHER (CLEANUP)
      .addMatcher(
        isAnyOf(
          fetchFinanceOverview.fulfilled,
          fetchSalesReport.fulfilled,
          fetchPnLReport.fulfilled,
          fetchBalanceSheet.fulfilled,
          fetchCashFlow.fulfilled,
          fetchExpenditures.fulfilled,
          recordTransaction.fulfilled,
          fetchAssets.fulfilled,
          setInitialBalance.fulfilled,
          purchaseAsset.fulfilled,
          sellAsset.fulfilled,
          fetchCapitalTransactions.fulfilled,
          createCapitalTransaction.fulfilled
        ),
        (state) => {
          state.loading = false;
          state.lastUpdated = new Date().toISOString();
        }
      );
  },
});

export const { 
  clearFinanceError, 
  clearFinanceSuccess, 
  resetFinanceState 
} = financeSlice.actions;

export default financeSlice.reducer;