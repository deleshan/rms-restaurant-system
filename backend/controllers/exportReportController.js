const mongoose = require('mongoose');
const Order = require('../models/Order');
const Expense = require('../models/Expense');
const Asset = require('../models/Asset');
const Transaction = require('../models/Transaction');
const Restaurant = require('../models/Restaurant');
const { toCSV } = require('../utils/financeExport.util');
const { generateFinanceReportPDF } = require('../utils/financeReportPdf.util');
const {
  getDateRange,
  ALL_CAPITAL_CATEGORIES,
  TAB_CATEGORY_GROUPS,
  CATEGORY_TO_FRONTEND_TYPE,
  buildMonthlyPnL,
} = require('./financeController');

// Shared helper: resolve start/end from either explicit dates or a named period
const resolveRange = (period, startDate, endDate, fallbackPeriod = 'thisMonth') => {
  if (startDate && endDate) {
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  return getDateRange(period || fallbackPeriod);
};

const exportReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { format = 'pdf', period, category, startDate, endDate } = req.query;
    const restaurantId = req.user.restaurantId;
    const restaurantObjId = new mongoose.Types.ObjectId(restaurantId);
    const restaurant = await Restaurant.findById(restaurantId).select('name currentBalance createdAt openingAuditTrail');

    let rows = [];        
    let columns = [];      
    let pdfRows = [];     
    let summary = {};    
    let title = 'Finance Report';
    let filenameBase = reportType;
    let periodLabel = '';

    switch (reportType) {

      // SALES 
      case 'sales': {
        const { start, end } = resolveRange(period, startDate, endDate);
        periodLabel = `${start.toDateString()} — ${end.toDateString()}`;

        const orders = await Order.find({
          restaurantId, createdAt: { $gte: start, $lte: end }, status: 'Completed', isPaid: true,
        });

        rows = orders.map(o => ({
          Date: o.createdAt.toISOString().split('T')[0],
          OrderId: String(o._id),
          Table: o.tableId,
          Total: o.totalPrice,
        }));
        columns = ['Date', 'Order ID', 'Table', 'Total (Rs.)'];
        pdfRows = orders.map(o => [
          o.createdAt.toISOString().split('T')[0],
          String(o._id).slice(-8),
          o.tableId,
          o.totalPrice.toLocaleString(),
        ]);

        const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
        summary = {
          'Total Orders': orders.length,
          'Total Revenue': `Rs. ${totalRevenue.toLocaleString()}`,
          'Avg Order Value': orders.length ? `Rs. ${(totalRevenue / orders.length).toFixed(2)}` : 'Rs. 0',
        };
        title = 'Sales Report';
        filenameBase = 'sales-report';
        break;
      }

      // PROFIT & LOSS
      case 'pnl': {
        const { start, end } = resolveRange(period, startDate, endDate);
        periodLabel = `${start.toDateString()} — ${end.toDateString()}`;

        const revenueAgg = await Order.aggregate([
          { $match: { restaurantId: restaurantObjId, createdAt: { $gte: start, $lte: end }, status: 'Completed', isPaid: true } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

        const cogsAgg = await Transaction.aggregate([
          { $match: { restaurant: restaurantObjId, category: 'COGS', status: 'COMPLETED', date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const cogs = cogsAgg[0]?.total || 0;

        const expenseAgg = await Expense.aggregate([
          { $match: { restaurantId: restaurantObjId, date: { $gte: start, $lte: end } } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
        ]);
        const totalExpenses = expenseAgg.reduce((s, e) => s + e.total, 0);
        const netProfit = totalRevenue - cogs - totalExpenses;

        columns = ['Line Item', 'Amount (Rs.)'];
        pdfRows = [
          ['Total Revenue', totalRevenue.toLocaleString()],
          ['COGS', cogs.toLocaleString()],
          ['Gross Profit', (totalRevenue - cogs).toLocaleString()],
          ...expenseAgg.map(e => [`Expense: ${e._id}`, e.total.toLocaleString()]),
          ['Total Expenses', totalExpenses.toLocaleString()],
          ['Net Profit', netProfit.toLocaleString()],
        ];
        rows = pdfRows.map(([label, amount]) => ({ LineItem: label, Amount: amount }));

        summary = {
          'Total Revenue': `Rs. ${totalRevenue.toLocaleString()}`,
          'Net Profit': `Rs. ${netProfit.toLocaleString()}`,
          'Margin': totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : '0%',
        };
        title = 'Profit & Loss Statement';
        filenameBase = 'profit-and-loss';
        break;
      }

      // BALANCE SHEET (point-in-time, no date range)
      case 'balance-sheet': {
        const cb = restaurant.currentBalance || {};
        periodLabel = `As of ${new Date().toDateString()}`;

        const totalAssets = (cb.cash || 0) + (cb.bank || 0) + (cb.inventoryValue || 0)
          + (cb.accountsReceivable || 0) + (cb.propertyEquipment || 0) - (cb.accumulatedDepreciation || 0);
        const totalLiabilities = (cb.accountsPayable || 0) + (cb.shortTermDebt || 0) + (cb.longTermLoans || 0);
        const totalEquity = totalAssets - totalLiabilities;

        columns = ['Line Item', 'Amount (Rs.)'];
        pdfRows = [
          ['Cash', (cb.cash || 0).toLocaleString()],
          ['Bank', (cb.bank || 0).toLocaleString()],
          ['Inventory Value', (cb.inventoryValue || 0).toLocaleString()],
          ['Accounts Receivable', (cb.accountsReceivable || 0).toLocaleString()],
          ['Property & Equipment', (cb.propertyEquipment || 0).toLocaleString()],
          ['Accumulated Depreciation', (-(cb.accumulatedDepreciation || 0)).toLocaleString()],
          ['Total Assets', totalAssets.toLocaleString()],
          ['Accounts Payable', (cb.accountsPayable || 0).toLocaleString()],
          ['Short-Term Debt', (cb.shortTermDebt || 0).toLocaleString()],
          ['Long-Term Loans', (cb.longTermLoans || 0).toLocaleString()],
          ['Total Liabilities', totalLiabilities.toLocaleString()],
          ['Total Equity', totalEquity.toLocaleString()],
        ];
        rows = pdfRows.map(([label, amount]) => ({ LineItem: label, Amount: amount }));

        summary = {
          'Total Assets': `Rs. ${totalAssets.toLocaleString()}`,
          'Total Liabilities': `Rs. ${totalLiabilities.toLocaleString()}`,
          'Total Equity': `Rs. ${totalEquity.toLocaleString()}`,
        };
        title = 'Balance Sheet';
        filenameBase = 'balance-sheet';
        break;
      }

      // CASH FLOW 
      case 'cashflow': {
        const { start, end } = resolveRange(period, startDate, endDate);
        periodLabel = `${start.toDateString()} — ${end.toDateString()}`;

        const salesAgg = await Transaction.aggregate([
          { $match: { restaurant: restaurantObjId, type: 'INCOME', category: 'SALES', status: 'COMPLETED', date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const cashIn = salesAgg[0]?.total || 0;

        const expenseAgg = await Expense.aggregate([
          { $match: { restaurantId: restaurantObjId, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalOpEx = expenseAgg[0]?.total || 0;
        const operatingCashFlow = cashIn - totalOpEx;

        columns = ['Line Item', 'Amount (Rs.)'];
        pdfRows = [
          ['Cash Inflow (Sales)', cashIn.toLocaleString()],
          ['Operating Expenses', totalOpEx.toLocaleString()],
          ['Operating Cash Flow', operatingCashFlow.toLocaleString()],
        ];
        rows = pdfRows.map(([label, amount]) => ({ LineItem: label, Amount: amount }));

        summary = { 'Operating Cash Flow': `Rs. ${operatingCashFlow.toLocaleString()}` };
        title = 'Cash Flow Statement';
        filenameBase = 'cashFlow';
        break;
      }

      // EXPENDITURES
      case 'expenditures': {
        const { start, end } = resolveRange(period, startDate, endDate);
        periodLabel = `${start.toDateString()} — ${end.toDateString()}`;

        const filter = { restaurantId, date: { $gte: start, $lte: end } };
        if (category) filter.category = category;

        const expenses = await Expense.find(filter).sort({ date: -1 });
        rows = expenses.map(e => ({
          Date: e.date.toISOString().split('T')[0],
          Category: e.category,
          Description: e.description,
          PaidTo: e.paidTo,
          Amount: e.amount,
        }));
        columns = ['Date', 'Category', 'Description', 'Paid To', 'Amount (Rs.)'];
        pdfRows = expenses.map(e => [
          e.date.toISOString().split('T')[0],
          e.category,
          e.description,
          e.paidTo || '—',
          e.amount.toLocaleString(),
        ]);

        const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
        summary = { 'Total Expenses': `Rs. ${totalAmount.toLocaleString()}`, 'Records': expenses.length };
        title = 'Expenses Report';
        filenameBase = 'expenses';
        break;
      }

      // CAPITAL TRANSACTIONS
      case 'transactions': {
        const filter = { restaurant: restaurantId, category: { $in: ALL_CAPITAL_CATEGORIES } };

        if (category && category !== 'all' && TAB_CATEGORY_GROUPS[category]) {
          filter.category = { $in: TAB_CATEGORY_GROUPS[category] };
        }
        const { start, end } = resolveRange(period, startDate, endDate, null);
        if (start && end) filter.date = { $gte: start, $lte: end };
        periodLabel = start && end ? `${start.toDateString()} — ${end.toDateString()}` : 'All time';

        const docs = await Transaction.find(filter).sort({ date: -1 });
        rows = docs.map(t => ({
          Date: t.date.toISOString().split('T')[0],
          Description: t.description,
          Type: CATEGORY_TO_FRONTEND_TYPE[t.category] || t.category,
          Counterparty: t.details?.counterparty || '—',
          PaymentMethod: t.paymentMethod,
          Amount: t.amount,
        }));
        columns = ['Date', 'Description', 'Type', 'Counterparty', 'Method', 'Amount'];
        pdfRows = docs.map(t => [
          t.date.toISOString().split('T')[0],
          t.description,
          CATEGORY_TO_FRONTEND_TYPE[t.category] || t.category,
          t.details?.counterparty || '—',
          t.paymentMethod,
          `Rs. ${t.amount.toLocaleString()}`,
        ]);

        const totalIn = docs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
        const totalOut = docs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
        summary = {
          'Total Inflow': `Rs. ${totalIn.toLocaleString()}`,
          'Total Outflow': `Rs. ${totalOut.toLocaleString()}`,
          'Net': `Rs. ${(totalIn - totalOut).toLocaleString()}`,
        };
        title = 'Capital Transactions Report';
        filenameBase = 'capital-transactions';
        break;
      }

      // ASSETS
      case 'assets': {
        const assets = await Asset.find({ restaurantId }).sort({ createdAt: -1 });
        periodLabel = `As of ${new Date().toDateString()}`;

        rows = assets.map(a => ({
          Name: a.name,
          Type: a.assetType,
          PurchaseCost: a.purchaseCost,
          CurrentValue: a.bookValue ?? a.currentValue ?? a.purchaseCost,
          Status: a.status,
        }));
        columns = ['Name', 'Type', 'Purchase Cost', 'Current Value', 'Status'];
        pdfRows = assets.map(a => [
          a.name,
          a.assetType,
          a.purchaseCost.toLocaleString(),
          (a.bookValue ?? a.currentValue ?? a.purchaseCost).toLocaleString(),
          a.status,
        ]);

        const totalValue = assets.reduce((s, a) => s + (a.bookValue ?? a.currentValue ?? a.purchaseCost), 0);
        summary = { 'Total Assets': assets.length, 'Total Book Value': `Rs. ${totalValue.toLocaleString()}` };
        title = 'Fixed Assets Register';
        filenameBase = 'assets-register';
        break;
      }

      // OVERVIEW (KPI snapshot)
      case 'overview': {
        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
        periodLabel = `This Month (from ${startOfMonth.toDateString()})`;

        const revenueAgg = await Transaction.aggregate([
          { $match: { restaurant: restaurantObjId, category: 'SALES', type: 'INCOME', status: 'COMPLETED', date: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const revenue = revenueAgg[0]?.total || 0;
        const cashBalance = (restaurant.currentBalance?.cash || 0) + (restaurant.currentBalance?.bank || 0);

        columns = ['Metric', 'Value'];
        pdfRows = [
          ['This Month Revenue', `Rs. ${revenue.toLocaleString()}`],
          ['Cash Balance', `Rs. ${cashBalance.toLocaleString()}`],
        ];
        rows = pdfRows.map(([label, value]) => ({ Metric: label, Value: value }));
        summary = { 'This Month Revenue': `Rs. ${revenue.toLocaleString()}`, 'Cash Balance': `Rs. ${cashBalance.toLocaleString()}` };
        title = 'Finance Overview';
        filenameBase = 'finance-overview';
        break;
      }

      default:
        return res.status(400).json({ success: false, message: `Unknown report type "${reportType}"` });
    }

    // OUTPUT
    if (format === 'pdf') {
      const pdfBuffer = await generateFinanceReportPDF({
        title,
        restaurantName: restaurant?.name,
        periodLabel,
        summary,
        columns,
        rows: pdfRows,
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}-${Date.now()}.pdf"`);
      return res.status(200).send(pdfBuffer);
    }

    if (format === 'csv') {
      const csv = toCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(501).json({ success: false, message: `Format "${format}" not supported — use "pdf" or "csv".` });

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { exportReport };