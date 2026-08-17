const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getSalesReport,
  getProfitAndLoss,
  getBalanceSheet,
  getExpenses,
  addExpense,
  getInventory,
  addInventoryPurchase,
  getAssets,
  addAsset,
  getFinanceOverview,
  getKitchenInventory,
  toggleItemAvailability,
  updateStockLevel,
  getCashFlow,
  setOpeningBalance,
  purchaseAsset,
  sellAsset,
  recordTransaction,
  getCapitalTransactions,
  createCapitalTransaction,
  getActiveLoans,
  updateExpense,
} = require('../controllers/financeController');

const { exportReport } = require ('../controllers/exportReportController');
const { getPendingPayments, payBill } = require('../controllers/pendingPaymentsController');

// Authenticate all routes
router.use(protect);

/**
 * KITCHEN / KDS SPECIFIC ROUTES
 * Accessible by both 'admin' and 'kitchen' roles
 */
router.get('/inventory/kitchen', restrictTo('admin', 'kitchen'), getKitchenInventory);
router.patch('/inventory/:id/toggle', restrictTo('admin', 'kitchen'), toggleItemAvailability);
router.patch('/inventory/:id/stock', restrictTo('admin', 'kitchen'), updateStockLevel);

/**
 * FINANCE / ADMIN SPECIFIC ROUTES
 * Strictly 'admin' only
 */
router.use(restrictTo('admin'));

// System Initialization 
// This is the "Day 0" setup route we created
router.post('/opening-balance', setOpeningBalance); 

// Core Financial Reports 
router.get('/overview', getFinanceOverview);
router.get('/sales', getSalesReport);
router.get('/pnl', getProfitAndLoss);
router.get('/balance-sheet', getBalanceSheet);
router.get('/cash-flows', getCashFlow);

router.get('/payables', getPendingPayments);
router.patch('/payables/:id/pay', payBill);

// Transaction & Asset Management 
router.route('/expenses')
  .get(getExpenses)
  .post(addExpense);
router.patch('/expenses/:id', protect, updateExpense);
router.post('/transactions', recordTransaction);

router.route('/inventory')
  .get(getInventory)
  .post(addInventoryPurchase);

router.route('/capital-transactions')
  .get(getCapitalTransactions)
  .post(createCapitalTransaction);

router.get('/loans/active', getActiveLoans);
router.get('/export/:reportType', exportReport);

router.post('/assets/purchase',    purchaseAsset);
router.post('/assets/:id/sell',    sellAsset);  
router.route('/assets')
  .get(getAssets)
  .post(addAsset);

module.exports = router;