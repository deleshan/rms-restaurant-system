import { createSlice } from '@reduxjs/toolkit';
import { fetchPendingPayments, payBill } from './financeThunks';

const initialState = {
  bills: [], totalOwed: 0, overdueTotal: 0,
  byCategory: { inventory: 0, assets: 0 },
  loading: false, error: null, successMessage: null,
};

const payablesSlice = createSlice({
  name: 'payables',
  initialState,
  reducers: {
    clearPayablesStatus: (s) => { s.error = null; s.successMessage = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchPendingPayments.pending, (s) => { s.loading = true; })
     .addCase(fetchPendingPayments.fulfilled, (s, a) => {
        s.loading = false;
        s.bills = a.payload.bills;
        s.totalOwed = a.payload.totalOwed;
        s.overdueTotal = a.payload.overdueTotal;
        s.byCategory = a.payload.byCategory;
     })
     .addCase(fetchPendingPayments.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(payBill.fulfilled, (s) => { s.successMessage = 'Bill marked as paid'; })
     .addCase(payBill.rejected, (s, a) => { s.error = a.payload; });
  },
});

export const { clearPayablesStatus } = payablesSlice.actions;
export default payablesSlice.reducer;