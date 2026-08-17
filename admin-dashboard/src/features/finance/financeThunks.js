import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

/**
 * Utility: Standardizes error message extraction
 */
const getErrorMessage = (err, defaultMsg) => {
  return err.response?.data?.message || defaultMsg;
};

/**
 * @desc    Fetch overall finance dashboard overview (KPIs & Trends)
 */
export const fetchFinanceOverview = createAsyncThunk(
  'finance/fetchOverview',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/finance/overview', { params });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load finance overview'));
    }
  }
);

/**
 * @desc    Fetch sales report with analytics
 */
export const fetchSalesReport = createAsyncThunk(
  'finance/fetchSalesReport',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/finance/sales', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load sales report'));
    }
  }
);

/**
 * @desc    Fetch Profit & Loss Statement
 */
export const fetchPnLReport = createAsyncThunk(
  'finance/fetchPnLReport',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/finance/pnl', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load P&L report'));
    }
  }
);

/**
 * @desc    Fetch Cash Flow Statement
 */
export const fetchCashFlow = createAsyncThunk(
  'finance/fetchCashFlow',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/finance/cash-flows', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load cash flow'));
    }
  }
);

/**
 * @desc    Fetch Expenditures/Expenses breakdown
 * @route   GET /api/finance/expenditures
 * @params  { category, status, startDate, endDate }
 */
export const fetchExpenditures = createAsyncThunk(
  'finance/fetchExpenditures',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/finance/expenses', { params });
      return response.data; 
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load expenditures'));
    }
  }
);

/**
 * @desc    Fetch Balance Sheet
 */
export const fetchBalanceSheet = createAsyncThunk(
  'finance/fetchBalanceSheet',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/finance/balance-sheet', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load balance sheet'));
    }
  }
);

/**
 * @desc    Export Financial Reports (PDF/Excel)
 */
export const exportFinanceReport = createAsyncThunk(
  'finance/exportReport',
  async ({ reportType, format = 'pdf', filters = {} }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/finance/export/${reportType}`, {
        params: { format, ...filters },
        responseType: 'blob',
      });

      const mimeTypes = {
        pdf: 'application/pdf',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        csv: 'text/csv'
      };

      const blob = new Blob([response.data], { type: mimeTypes[format] || mimeTypes.pdf });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      return rejectWithValue('Failed to generate report download');
    }
  }
);

/**
 * @desc    Record a manual financial transaction (Expense or Income)
 */
export const recordTransaction = createAsyncThunk(
  'finance/recordTransaction',
  async (transactionData, { rejectWithValue }) => {    // remove unused 'dispatch'
    try {
      const response = await api.post('/finance/transactions', transactionData);
      return response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to record transaction'));
    }
  }
);

/**
 * @desc    Fetch Fixed Asset Register
 */
export const fetchAssets = createAsyncThunk(
  'finance/fetchAssets',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/finance/assets', { params });
      return response.data; 
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to load assets'));
    }
  }
);

/**
 * @desc    Establish Opening Balance (Final Year Project Baseline)
 * @route   POST /api/finance/opening-balance
 */
export const setInitialBalance = createAsyncThunk(
  'finance/setInitialBalance',
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/finance/opening-balance', formData);
      dispatch(fetchFinanceOverview());
      
      return response.data.data; 
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to establish initial balance'));
    }
  }
);

// Record a new Asset Purchase
export const purchaseAsset = createAsyncThunk(
  'finance/purchaseAsset',
  async (assetData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/finance/assets/purchase', assetData);
      dispatch(fetchAssets());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to purchase asset');
    }
  }
);

// Record an Asset Sale (Disposal)
export const sellAsset = createAsyncThunk(
  'finance/sellAsset',
  async ({ id, saleData }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post(`/finance/assets/${id}/sell`, saleData);
      dispatch(fetchAssets());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to sell asset');
    }
  }
);

/**
 * @desc    Fetch Capital Transactions (Loans, Investments, Owner Equity)
 * @route   GET /api/finance/capital-transactions
 */
export const fetchCapitalTransactions = createAsyncThunk(
  'finance/fetchCapitalTransactions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/finance/capital-transactions', { params });
      return response.data.data; // Expecting structure: { transactions: [], totals: {} }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load capital ledger');
    }
  }
);

/**
 * @desc    Record a new Capital transaction (Loan, Injection, or Drawing)
 * @route   POST /api/finance/capital-transactions
 */
export const createCapitalTransaction = createAsyncThunk(
  'finance/createCapitalTransaction',
  async (transactionData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/finance/capital-transactions', transactionData);
      dispatch(fetchCapitalTransactions());
      dispatch(fetchBalanceSheet());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to record capital flow');
    }
  }
);

export const fetchActiveLoans = createAsyncThunk(
  'finance/fetchActiveLoans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/finance/loans/active');
      return response.data.data; // { activeLoans: [], allLoans: [] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load active loans');
    }
  }
);

export const updateExpense = createAsyncThunk(
  'finance/updateExpense',
  async ({ id, ...updates }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.patch(`/finance/expenses/${id}`, updates);
      dispatch(fetchExpenditures());  
      dispatch(fetchPnLReport());      
      return response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Failed to update expense'));
    }
  }
);

export const fetchPendingPayments = createAsyncThunk(
  'payables/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/finance/payables');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load pending payments');
    }
  }
);

export const payBill = createAsyncThunk(
  'payables/pay',
  async ({ id, paymentMethod, paidDate }, { rejectWithValue, dispatch }) => {
    try {
      const res = await api.patch(`/finance/payables/${id}/pay`, { paymentMethod, paidDate });
      dispatch(fetchPendingPayments());
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark as paid');
    }
  }
);


const financeThunks = {
  fetchFinanceOverview,
  fetchSalesReport,
  fetchPnLReport,
  fetchCashFlow,
  fetchExpenditures,
  fetchBalanceSheet,
  exportFinanceReport,
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
};

export default financeThunks;