const Order = require('../models/Order');
const Expense = require('../models/Expense');
const Inventory = require('../models/Inventory');
const Asset = require('../models/Asset');
const Transaction = require('../models/Transaction');
const Restaurant = require('../models/Restaurant'); 
const mongoose = require('mongoose');
const { recalculateAvailabilityForInventoryItem } = require('../utils/menuAvailability.util');
const { toCSV } = require('../utils/financeExport.util');
const { generateFinanceReportPDF } = require('../utils/financeReportPdf.util');
const { 
  calculateAssetDepreciation, 
  calculateTotalDepreciation, 
  calculateBookValue 
} = require('../utils/depreciation.util');

const CAPITAL_TYPE_MAP = {
  Loan_Disbursement: { type: 'INCOME',  category: 'LOAN_DISBURSEMENT' },
  Loan_Repayment:    { type: 'EXPENSE', category: 'LOAN_REPAYMENT' },
  Investment_In:     { type: 'INCOME',  category: 'INVESTMENT_IN' },
  Investment_Out:    { type: 'EXPENSE', category: 'INVESTMENT_OUT' },
  Owner_Investment:  { type: 'INCOME',  category: 'OWNER_INVESTMENT' },
  Owner_Drawing:     { type: 'EXPENSE', category: 'OWNER_DRAWING' },
};

const CATEGORY_TO_FRONTEND_TYPE = Object.entries(CAPITAL_TYPE_MAP)
  .reduce((acc, [frontendType, { category }]) => {
    acc[category] = frontendType;
    return acc;
  }, {});

CATEGORY_TO_FRONTEND_TYPE['OPENING_LOAN'] = 'Opening_Loan';
CATEGORY_TO_FRONTEND_TYPE['OPENING_CAPITAL'] = 'Opening_Capital';

const TAB_CATEGORY_GROUPS = {
  loans:       ['LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'OPENING_LOAN'],
  investments: ['INVESTMENT_IN', 'INVESTMENT_OUT'],
  equity:      ['OWNER_INVESTMENT', 'OWNER_DRAWING', 'OPENING_CAPITAL'],
};

const ALL_CAPITAL_CATEGORIES = [
  ...Object.values(CAPITAL_TYPE_MAP).map(v => v.category),
  'OPENING_LOAN',
  'OPENING_CAPITAL',
];;


// Helper: Get date range (start/end of day, month, etc.)
const getDateRange = (period) => {
  const now = new Date();

  switch (period) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case 'yesterday': {
      const start = new Date(now);
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case 'last7days': {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); 
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case 'month':
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }

    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }

    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }

    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  }
};

/**
 * @desc    Initialize Restaurant Financial Balance
 * @route   POST /api/finance/opening-balance
 * @access  Private/Admin
 */
const setOpeningBalance = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const userId = req.user.id;

    const restaurant = await Restaurant.findById(restaurantId);
    if (restaurant.isInitialized) {
      return res.status(400).json({ success: false, message: 'Financial baseline has already been established.' });
    }

    const {
      cashAmount, bankAmount, ownerCapital, retainedEarnings, note, asOfDate,
      inventoryItems = [],   
      assets = [],           
      loans = [],            
      payables = [],         
    } = req.body;

    const openingDate = asOfDate ? new Date(asOfDate) : new Date();
    const warnings = [];

    const initialTransaction = await Transaction.create({
      restaurant: restaurantId,
      user: userId,
      type: 'ADJUSTMENT',
      category: 'OPENING_BALANCE',
      amount: (Number(cashAmount) || 0) + (Number(bankAmount) || 0),
      paymentMethod: 'MULTIPLE',
      details: {
        cashComponent: Number(cashAmount) || 0,
        bankComponent: Number(bankAmount) || 0,
        inventoryValue: 0,
        accountsReceivable: 0,
        propertyEquipment: 0,
        accumulatedDepreciation: 0,
        accountsPayable: 0,
        shortTermDebt: 0,
        longTermLoans: 0,
        ownerCapital: 0,
        retainedEarnings: Number(retainedEarnings) || 0,
        referenceNumber: `SYS-INIT-${Date.now()}`,
        isInitialSetup: true,
      },
      description: note || 'System Initialization: Opening Balance Sheet',
      date: openingDate,
      status: 'COMPLETED',
      isSystemGenerated: true,
    });

    const ownerCapitalAmount = Number(ownerCapital) || 0;
    if (ownerCapitalAmount > 0) {
      await Transaction.create({
        restaurant: restaurantId,
        user: userId,
        type: 'ADJUSTMENT',
        category: 'OPENING_CAPITAL',
        amount: ownerCapitalAmount,
        paymentMethod: 'MULTIPLE',
        description: 'Owner capital opening balance',
        date: openingDate,
        status: 'COMPLETED',
        isSystemGenerated: true,
        details: {
          counterparty: 'Owner (Opening Balance)',
          isInitialSetup: true,
          referenceNumber: `CAP-INIT-${Date.now()}`,
        },
      });
    }

    for (const inv of inventoryItems) {
      try {
        if (!inv.name?.trim() || !inv.unit) { warnings.push(`Skipped an inventory row missing name/unit.`); continue; }

        const existing = await Inventory.findOne({
          restaurantId, name: { $regex: new RegExp(`^${inv.name.trim()}$`, 'i') },
        });
        if (existing) { warnings.push(`Inventory item "${inv.name}" already exists — skipped.`); continue; }

        const stockQty = Number(inv.currentStock) || 0;
        const unitCost = Number(inv.costPerUnit) || 0;

        const item = await Inventory.create({
          restaurantId,
          name: inv.name.trim(),
          sku: inv.sku?.trim() || undefined,
          category: inv.category || 'Other',
          unit: inv.unit,
          currentStock: stockQty,
          minimumStock: Number(inv.minimumStock) || 5,
          costPerUnit: unitCost,
          supplier: inv.supplier || '',
          expiryDate: inv.expiryDate ? new Date(inv.expiryDate) : undefined,
          batches: stockQty > 0 ? [{
            quantity: stockQty,
            expiryDate: inv.expiryDate ? new Date(inv.expiryDate) : null,
            costPerBatchUnit: unitCost,
            purchaseDate: openingDate,
          }] : [],
        });

        const totalCost = stockQty * unitCost;
        if (totalCost > 0) {
          await Transaction.create({
            restaurant: restaurantId,
            user: userId,
            type: 'ADJUSTMENT',
            category: 'OPENING_STOCK',
            amount: totalCost,
            paymentMethod: 'MULTIPLE',
            description: `Opening stock: ${item.name}`,
            date: openingDate,
            status: 'COMPLETED',
            isSystemGenerated: true,
            details: { inventoryValue: totalCost, isInitialSetup: true, referenceNumber: `INV-INIT-${Date.now()}` },
          });
        }
        await recalculateAvailabilityForInventoryItem(item._id, restaurantId, req.io);
      } catch (e) {
        warnings.push(`Inventory item "${inv.name}": ${e.message}`);
      }
    }

    for (const a of assets) {
      try {
        if (!a.name?.trim() || !a.assetType || !a.purchaseCost) { warnings.push(`Skipped an asset row missing required fields.`); continue; }

        const asset = await Asset.create({
          restaurantId,
          name: a.name.trim(),
          assetType: a.assetType,
          purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : openingDate,
          purchaseCost: Number(a.purchaseCost),
          usefulLife: a.usefulLife ? Number(a.usefulLife) : null,
          depreciationMethod: a.depreciationMethod || 'straight-line',
          salvageValue: Number(a.salvageValue) || 0,
          currentValue: Number(a.currentValue) || Number(a.purchaseCost),
          isInitial: true,
          notes: a.notes || '',
          status: 'Active',
        });

        await Transaction.create({
          restaurant: restaurantId,
          user: userId,
          type: 'ADJUSTMENT',
          category: 'OPENING_ASSET',
          amount: asset.purchaseCost,
          paymentMethod: 'MULTIPLE',
          description: `Opening fixed asset: ${asset.name}`,
          date: openingDate,
          status: 'COMPLETED',
          isSystemGenerated: true,
          details: { assetId: asset._id, isInitialSetup: true, referenceNumber: `AST-INIT-${Date.now()}` },
        });
      } catch (e) {
        warnings.push(`Asset "${a.name}": ${e.message}`);
      }
    }

    for (const loan of loans) {
      try {
        const principal = Number(loan.principalAmount) || 0;
        if (principal <= 0) continue;
        const debtBucket = (loan.durationMonths && Number(loan.durationMonths) <= 12) ? 'shortTermDebt' : 'longTermLoans';

        await Transaction.create({
          restaurant: restaurantId,
          user: userId,
          type: 'ADJUSTMENT',
          category: 'OPENING_LOAN',
          amount: principal,
          paymentMethod: 'MULTIPLE',
          description: `Opening loan balance: ${loan.counterparty || 'Lender'}`,
          date: loan.disbursementDate ? new Date(loan.disbursementDate) : openingDate,
          status: 'COMPLETED',
          isSystemGenerated: true,
          details: {
            counterparty: loan.counterparty || 'Unknown Lender',
            interestRate: Number(loan.interestRate) || 0,
            durationMonths: Number(loan.durationMonths) || 0,
            monthlyInstallment: Number(loan.monthlyInstallment) || 0,
            debtBucket,
            isInitialSetup: true,
            referenceNumber: `LOAN-INIT-${Date.now()}`,
          },
        });
      } catch (e) {
        warnings.push(`Loan "${loan.counterparty}": ${e.message}`);
      }
    }

    for (const bill of payables) {
      try {
        const amount = Number(bill.amount) || 0;
        if (amount <= 0) continue;

        await Transaction.create({
          restaurant: restaurantId,
          user: userId,
          type: 'EXPENSE',
          category: 'PURCHASE',
          amount,
          paymentMethod: 'BANK_TRANSFER',
          description: bill.description || `Opening payable: ${bill.supplier || 'Supplier'}`,
          date: openingDate,
          status: 'PENDING',
          details: {
            counterparty: bill.supplier || 'Unknown Supplier',
            dueDate: bill.dueDate ? new Date(bill.dueDate) : null,
            referenceNumber: `PAY-INIT-${Date.now()}`,
          },
        });
      } catch (e) {
        warnings.push(`Payable "${bill.supplier}": ${e.message}`);
      }
    }

    const updatedRestaurant = await Restaurant.findById(restaurantId).select('currentBalance isInitialized name');

    res.status(200).json({
      success: true,
      data: updatedRestaurant,
      transactionId: initialTransaction._id,
      warnings: warnings.length ? warnings : undefined,
    });
  } catch (error) {
    console.error('Opening balance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Sales Report
// @route   GET /api/finance/sales?period=today|week|month
const getSalesReport = async (req, res) => {
  try {
    const { period = 'thisMonth', startDate, endDate } = req.query;
    const restaurantId = req.user.restaurantId;

    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      ({ start, end } = getDateRange(period));
    }

    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: start, $lte: end },
      status: 'Completed',
      isPaid: true, 
    });

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate Daily Sales for the Chart
    const dailyMap = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, orders: 0 };
      dailyMap[date].revenue += order.totalPrice;
      dailyMap[date].orders += 1;
    });
    const dailySales = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Product Performance Breakdown
    const itemSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.name]) itemSales[item.name] = { quantity: 0, revenue: 0 };
        itemSales[item.name].quantity += item.qty;
        itemSales[item.name].revenue += (item.price * item.qty);
      });
    });

    const topProducts = Object.entries(itemSales)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueGrowth: 0, 
      ordersGrowth: 0,
      topProduct: topProducts[0]?.name || 'None',
      topProductRevenue: topProducts[0]?.revenue || 0,
      dailySales,
      topProducts,
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};




// @desc    Get Profit & Loss
// @route   GET /api/finance/pnl?period=month
const getProfitAndLoss = async (req, res) => {
  try {
    const { period = 'thisMonth', startDate, endDate } = req.query;
    const restaurantId = req.user.restaurantId;
    const restaurantObjId = new mongoose.Types.ObjectId(restaurantId);

    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate); start.setHours(0, 0, 0, 0);
      end   = new Date(endDate);   end.setHours(23, 59, 59, 999);
    } else {
      ({ start, end } = getDateRange(period));
    }

    // REVENUE BY CATEGORY
    const revenueByCategoryAgg = await Order.aggregate([
      { $match: { restaurantId: restaurantObjId, createdAt: { $gte: start, $lte: end }, status: 'Completed', isPaid: true } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'menuItemDoc',
        },
      },
      { $unwind: { path: '$menuItemDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$menuItemDoc.category', 'Uncategorized'] },
          total: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
        },
      },
    ]);

    const categoryTotals = revenueByCategoryAgg.reduce((acc, c) => {
      acc[c._id] = c.total;
      return acc;
    }, {});

    const mainCourseRevenue = categoryTotals['Main Course'] || 0;
    const appetizersRevenue = categoryTotals['Appetizers'] || 0;
    const beveragesRevenue  = categoryTotals['Beverages'] || 0;
    const breadRevenue      = categoryTotals['Bread'] || 0;

    const totalRevenue = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
    const otherFoodRevenue = Math.max(0, totalRevenue - (mainCourseRevenue + appetizersRevenue + beveragesRevenue + breadRevenue));

    // COGS (from FIFO-costed Transaction ledger)
    const cogsAgg = await Transaction.aggregate([
      {
        $match: {
          restaurant: restaurantObjId,
          category: 'COGS',
          status: 'COMPLETED',
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const cogs = cogsAgg[0]?.total || 0;
    const grossProfit = totalRevenue - cogs;

    // OPERATING EXPENSES
    const expenseCategoryAgg = await Expense.aggregate([
      { $match: { restaurantId: restaurantObjId, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    const expMap = expenseCategoryAgg.reduce((acc, e) => { acc[e._id] = e.total; return acc; }, {});

    const expensesStaff       = expMap['Salaries'] || 0;
    const expensesUtilities   = (expMap['Utilities'] || 0) + (expMap['Rent'] || 0);
    const expensesMarketing   = expMap['Marketing'] || 0;
    const expensesMaintenance = expMap['Maintenance'] || 0;
    const interestExpense     = expMap['Interest'] || 0;

    const AllAssets = await Asset.find({ restaurantId, status: { $nin: ['Sold', 'Disposed'] } });

    const depreciationExpense = AllAssets.reduce((acc, asset) => {
      const currentBookValue = calculateBookValue(asset, new Date());
      return acc + (asset.purchaseCost - currentBookValue);
    }, 0);

    const NAMED_EXPENSE_CATEGORIES = ['Salaries', 'Utilities', 'Rent', 'Marketing', 'Maintenance', 'Interest', 'Ingredients', 'Supplies'];
    const otherExpenses = Object.entries(expMap)
      .filter(([category]) => !NAMED_EXPENSE_CATEGORIES.includes(category))
      .reduce((sum, [, v]) => sum + v, 0);

    const totalExpenses = expensesStaff + expensesUtilities + expensesMarketing
      + expensesMaintenance + interestExpense + otherExpenses + depreciationExpense;

    // NET PROFIT & OTHER PROFITS
    const netProfit = grossProfit - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const assetGainLossAgg = await Transaction.aggregate([
      { $match: { restaurant: restaurantObjId, category: { $in: ['ASSET_GAIN', 'ASSET_LOSS'] }, date: { $gte: start, $lte: end }, status: 'COMPLETED' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    const glMap = assetGainLossAgg.reduce((acc, r) => { acc[r._id] = r.total; return acc; }, {});
    const otherProfits = (glMap.ASSET_GAIN || 0) - (glMap.ASSET_LOSS || 0);

    const totalNetProfit = netProfit + otherProfits;

    // ACCURATE PRIOR PERIOD GROWTH
    const periodLengthMs = end.getTime() - start.getTime();
    const prevEnd   = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodLengthMs);

    const [prevRevenueAgg, prevCogsAgg, prevExpenseAgg, prevDepreciation, prevAssetGainLossAgg] = await Promise.all([
      Order.aggregate([
        { $match: { restaurantId: restaurantObjId, createdAt: { $gte: prevStart, $lte: prevEnd }, status: 'Completed', isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Transaction.aggregate([
        { $match: { restaurant: restaurantObjId, category: 'COGS', status: 'COMPLETED', date: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { restaurantId: restaurantObjId, date: { $gte: prevStart, $lte: prevEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      computePeriodDepreciation(restaurantObjId, prevStart, prevEnd),
      Transaction.aggregate([
        { $match: { restaurant: restaurantObjId, category: { $in: ['ASSET_GAIN', 'ASSET_LOSS'] }, date: { $gte: prevStart, $lte: prevEnd }, status: 'COMPLETED' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ])
    ]);

    const prevRevenue = prevRevenueAgg[0]?.total || 0;
    const prevCogs = prevCogsAgg[0]?.total || 0;
    const prevExpenses = (prevExpenseAgg[0]?.total || 0) + prevDepreciation;
    const prevGlMap = prevAssetGainLossAgg.reduce((acc, r) => { acc[r._id] = r.total; return acc; }, {});
    const prevOtherProfits = (prevGlMap.ASSET_GAIN || 0) - (prevGlMap.ASSET_LOSS || 0);

    const prevNetProfit = (prevRevenue - prevCogs - prevExpenses) + prevOtherProfits;

    const pctChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return +(((curr - prev) / Math.abs(prev)) * 100).toFixed(1);
    };

    const monthly = await buildMonthlyPnL(restaurantId, restaurantObjId, end);

    res.status(200).json({
      revenueBreakdown: {
        mainCourse: mainCourseRevenue,
        appetizers: appetizersRevenue,
        beverages: beveragesRevenue,
        bread: breadRevenue,
        otherFood: otherFoodRevenue,
      },
      totalRevenue,
      revenueGrowth: pctChange(totalRevenue, prevRevenue),
      cogs,
      grossProfit,

      expensesStaff,
      expensesUtilities,
      expensesMarketing,
      expensesMaintenance,
      interestExpense,
      otherExpenses,
      depreciationExpense,
      totalExpenses,

      netProfit,
      margin,

      otherProfits,
      totalNetProfit,
      totalNetProfitGrowth: pctChange(totalNetProfit, prevNetProfit),

      monthly,
    });
  } catch (error) {
    console.error('P&L error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// HELPER: Optimized and complete last-6-month P&L trend chart computation
const buildMonthlyPnL = async (restaurantId, restaurantObjId, referenceDate = new Date(), monthsBack = 5) => {
  const monthPromises = [];

  for (let i = monthsBack; i >= 0; i--) {
    const d     = new Date(referenceDate);
    const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const end   = new Date(d.getFullYear(), d.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const label = start.toLocaleString('default', { month: 'short' });

    const monthQuery = (async () => {
      const [revenueAgg, cogsAgg, expenseAgg, depreciation] = await Promise.all([
        Order.aggregate([
          { $match: { restaurantId: restaurantObjId, createdAt: { $gte: start, $lte: end }, status: 'Completed', isPaid: true } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]),
        Transaction.aggregate([
          { $match: { restaurant: restaurantObjId, category: 'COGS', status: 'COMPLETED', date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Expense.aggregate([
          { $match: { restaurantId: restaurantObjId, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        computePeriodDepreciation(restaurantObjId, start, end)
      ]);

      const revenue = revenueAgg[0]?.total || 0;
      const cogs = cogsAgg[0]?.total || 0;
      const opExpenses = (expenseAgg[0]?.total || 0) + depreciation;
      const totalExpenses = cogs + opExpenses;

      return { month: label, revenue, totalExpenses, netProfit: revenue - totalExpenses };
    })();

    monthPromises.push(monthQuery);
  }

  return Promise.all(monthPromises);
};

// @desc    Get Balance Sheet
// @route   GET /api/finance/balance-sheet
const getBalanceSheet = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const restaurantObjId = new mongoose.Types.ObjectId(restaurantId);

    // Live Inventory Balance
    const allItems = await Inventory.find({ restaurantId });
    const totalStockValue = allItems.reduce((acc, i) => acc + (i.currentStock * (i.costPerUnit || 0)), 0);

    // Live Fixed Assets & Accumulated Depreciation
    const AllAssets = await Asset.find({ restaurantId, status: { $nin: ['Sold', 'Disposed'] } });
    const totalAssetsValue = AllAssets.reduce((acc, i) => acc + (i.purchaseCost ?? 0), 0);
    const totalDepreciationValue = AllAssets.reduce((acc, asset) => {
      const currentBookValue = calculateBookValue(asset, new Date());
      return acc + (asset.purchaseCost - currentBookValue);
    }, 0);

    // Live Accounts Receivable
    const accountsReceivable = await Order.find({ restaurantId, isPaid: false });
    const totalAccountsReceivable = accountsReceivable.reduce((acc, i) => acc + i.totalPrice, 0);

    // Restaurant Base Balance
    const restaurant = await Restaurant.findById(restaurantId).select('currentBalance openingAuditTrail createdAt');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const cb = restaurant.currentBalance;

    // Retained Earnings & Equity
    const sinceDate = restaurant.openingAuditTrail?.initialDate || restaurant.createdAt;
    const cumulativeNetProfit = await computeCumulativeNetProfit(restaurantId, restaurantObjId, sinceDate);
    const openingRetainedEarnings = cb.retainedEarnings || 0;
    const retainedEarnings = openingRetainedEarnings + cumulativeNetProfit;
    const totalEquity = (cb.ownerCapital || 0) + retainedEarnings;

    // Live Accounts Payable
    const apAgg = await Transaction.aggregate([
      { $match: { restaurant: restaurantObjId, status: 'PENDING', category: { $in: ['PURCHASE', 'ASSET_PURCHASE'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const liveAccountsPayable = apAgg[0]?.total || 0;
    const accountsPayable = (cb.accountsPayable || 0) + liveAccountsPayable;

    // Totals Calculation using Live Figures
    const cash = cb.cash || 0;
    const bank = cb.bank || 0;

    const currentAssets = cash + bank + totalStockValue + totalAccountsReceivable;
    const nonCurrentAssets = (totalAssetsValue - totalDepreciationValue) + (cb.externalInvestmentsHeld || 0);
    const totalAssets = currentAssets + nonCurrentAssets;

    const currentLiabilities = accountsPayable + (cb.shortTermDebt || 0);
    const totalLiabilities = currentLiabilities + (cb.longTermLoans || 0);

    res.status(200).json({
      success: true,
      totalAssets,
      totalLiabilities,
      totalEquity,

      cash: cash + bank,
      inventory: totalStockValue,
      receivables: totalAccountsReceivable,
      fixedAssets: totalAssetsValue,
      depreciation: totalDepreciationValue,
      externalInvestments: cb.externalInvestmentsHeld || 0,

      payables: accountsPayable,
      shortTermDebt: cb.shortTermDebt || 0,
      longTermDebt: cb.longTermLoans || 0,

      ownersCapital: cb.ownerCapital || 0,
      retainedEarnings,

      currentAssets,
      currentLiabilities,
    });

  } catch (error) {
    console.error('Balance sheet error:', error);
    res.status(500).json({ message: 'Server error pulling financial data' });
  }
};

// HELPER: Cumulative net profit from a given start date up to now (or an "as of" date)
// This is what feeds Retained Earnings on the balance sheet - NOT the period P&L number.
const computeCumulativeNetProfit = async (restaurantId, restaurantObjId, sinceDate, asOfDate = new Date()) => {
  const revenueAgg = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurantObjId,
        createdAt: { $gte: sinceDate, $lte: asOfDate },
        status: 'Completed',
        isPaid: true,
      },
    },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  const cogsAgg = await Transaction.aggregate([
      {
        $match: {
          restaurant: restaurantObjId,
          category: 'COGS',
          status: 'COMPLETED',
          date: { $gte: sinceDate, $lte: asOfDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const cogs = cogsAgg[0]?.total || 0;

  const expenseAgg = await Expense.aggregate([
    { $match: { restaurantId: restaurantObjId, date: { $gte: sinceDate, $lte: asOfDate } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalExpenses = expenseAgg[0]?.total || 0;

   const depreciation = await computePeriodDepreciation(restaurantObjId, sinceDate, asOfDate);

  const assetGainLossAgg = await Transaction.aggregate([
    {
      $match: {
        restaurant: restaurantObjId,
        category: { $in: ['ASSET_GAIN', 'ASSET_LOSS'] },
        date: { $gte: sinceDate, $lte: asOfDate },
        status: 'COMPLETED',
      },
    },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);
  const glMap = assetGainLossAgg.reduce((acc, r) => { acc[r._id] = r.total; return acc; }, {});
  const netAssetGainLoss = (glMap.ASSET_GAIN || 0) - (glMap.ASSET_LOSS || 0);

  return (totalRevenue + netAssetGainLoss) - cogs - totalExpenses - depreciation;
};

// HELPER: Depreciation expense for a specific period, prorated by days each
// asset was actually in service. Land never depreciates. Only Active assets count -
// Sold/Disposed assets already had their gain/loss booked via ASSET_GAIN/ASSET_LOSS.
const computePeriodDepreciation = async (restaurantObjId, start, end) => {
  const assets = await Asset.find({
    restaurantId: restaurantObjId,
    assetType: { $ne: 'Land' },
  });

  return calculateTotalDepreciation(assets, start, end);
};

// @desc    Get Expenses
// @route   GET /api/finance/expenses
const getExpenses = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { period, category, startDate, endDate } = req.query;

    const filter = { restaurantId };

    if (period) {
      const { start, end } = getDateRange(period);
      filter.date = { $gte: start, $lte: end };
    }
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (category) {
      filter.category = category;
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });

    // Build category breakdown
    const categoryMap = {};
    expenses.forEach(e => {
      if (!categoryMap[e.category]) categoryMap[e.category] = 0;
      categoryMap[e.category] += e.amount;
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.status(200).json({
      success: true,
      transactions: expenses,       
      totalAmount,                  
      categoryBreakdown,          
      count: expenses.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add Expense
// @route   POST /api/finance/expenses
const addExpense = async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    const restaurantId = req.user.restaurantId;

    const expense = new Expense({
      amount,
      category,
      description,
      date: date || new Date(),
      restaurantId,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Inventory
// @route   GET /api/finance/inventory
const getInventory = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const inventory = await Inventory.find({ restaurantId }).sort({ name: 1 });
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add Inventory Purchase
// @route   POST /api/finance/inventory
const addInventoryPurchase = async (req, res) => {
  try {
    const { name, qty, costPerUnit, supplier, paymentMethod } = req.body;
    const restaurantId = req.user.restaurantId;
    const totalCost = Number(qty) * Number(costPerUnit);

    const item = await Inventory.findOneAndUpdate(
      { name, restaurantId },
      {
        $inc: { currentStock: qty },
        costPerUnit,
        supplier,
        lastPurchaseDate: new Date(),
        lastPurchaseQty: qty,
        lastPurchaseCost: totalCost,
      },
      { upsert: true, new: true }
    );

    // post the real cash outflow + inventory asset increase
    if (totalCost > 0) {
      const paymentMethodMap = {
        'Cash': 'CASH', 'Bank_Transfer': 'BANK_TRANSFER',
        'Card': 'CARD', 'Cheque': 'BANK_TRANSFER', 'Other': 'CASH',
      };
      await Transaction.create({
        restaurant: restaurantId,
        user: req.user.id,
        type: 'EXPENSE',
        category: 'PURCHASE',
        amount: totalCost,
        paymentMethod: paymentMethodMap[paymentMethod] || 'CASH',
        description: `Inventory purchase: ${name} (${qty} ${item.unit || 'units'})`,
        isSystemGenerated: true,
        status: 'COMPLETED',
        date: new Date(),
        details: { inventoryValue: totalCost },
      });
    }
    await recalculateAvailabilityForInventoryItem(item._id, restaurantId, req.io);

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Assets
// @route   GET /api/finance/assets
const getAssets = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const assets = await Asset.find({ restaurantId }).sort({ createdAt: -1 });

    const enriched = assets.map((a) => {
      const obj = a.toObject();
      const liveBookValue = calculateBookValue(a, new Date());
      obj.currentValue = liveBookValue;
      obj.bookValue = liveBookValue;
      return obj;
    });

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add Asset
// @route   POST /api/finance/assets
const addAsset = async (req, res) => {
  try {
    const assetData = req.body;
    assetData.restaurantId = req.user.restaurantId;
    const asset = new Asset(assetData);
    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getFinanceOverview = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const restaurantObjId = new mongoose.Types.ObjectId(restaurantId);

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    const endOfLastMonth = new Date(startOfMonth.getTime() - 1);

    // Reusable: revenue + expenses (incl. COGS, excl. capital-structure movements) for any range
    const getRevenueAndExpenses = async (rangeStart, rangeEnd) => {
      const revenueAgg = await Transaction.aggregate([
        {
          $match: {
            restaurant: restaurantObjId,
            category: 'SALES',
            type: 'INCOME',
            status: 'COMPLETED',
            date: { $gte: rangeStart, $lte: rangeEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const expenseAgg = await Transaction.aggregate([
        {
          $match: {
            restaurant: restaurantObjId,
            type: 'EXPENSE',
            status: 'COMPLETED',
            category: { $nin: ['LOAN_REPAYMENT', 'INVESTMENT_OUT', 'OWNER_DRAWING', 'ASSET_PURCHASE', 'PURCHASE'] },
            date: { $gte: rangeStart, $lte: rangeEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const interestAgg = await Transaction.aggregate([
        {
          $match: {
            restaurant: restaurantObjId,
            category: 'LOAN_REPAYMENT',
            status: 'COMPLETED',
            date: { $gte: rangeStart, $lte: rangeEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$details.interestPortion' } } },
      ]);

      const AllAssets = await Asset.find({ restaurantId, status: { $nin: ['Sold', 'Disposed'] } });

      const totalDepreciationValue = AllAssets.reduce((acc, asset) => {
        const currentBookValue = calculateBookValue(asset, new Date());
        return acc + (asset.purchaseCost - currentBookValue);
      }, 0);

      const revenue = revenueAgg[0]?.total || 0;
      const expenses = (expenseAgg[0]?.total || 0) + (interestAgg[0]?.total || 0);
      return { revenue, expenses, profit: revenue - expenses - totalDepreciationValue };
    };

    const thisMonth = await getRevenueAndExpenses(startOfMonth, new Date());
    const lastMonth = await getRevenueAndExpenses(startOfLastMonth, endOfLastMonth);

    const pctChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return +(((curr - prev) / Math.abs(prev)) * 100).toFixed(1);
    };

    // Pending payments- unpaid, non-cancelled orders
    const pendingAgg = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantObjId,
          isPaid: false,
          status: { $ne: 'Cancelled' },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
    ]);
    const pendingPayments = pendingAgg[0]?.total || 0;
    const pendingCount = pendingAgg[0]?.count || 0;

    // Last 6 months trend for the chart
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      const mStart = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = mStart.toLocaleString('default', { month: 'short' });

      const { revenue, profit } = await getRevenueAndExpenses(mStart, mEnd);
      monthly.push({ month: label, revenue, profit });
    }

    res.status(200).json({
      success: true,
      data: {
        isInitialized: restaurant.isInitialized || false,

        totalRevenue: thisMonth.revenue,
        revenueGrowth: pctChange(thisMonth.revenue, lastMonth.revenue),

        netProfit: thisMonth.profit,
        profitGrowth: pctChange(thisMonth.profit, lastMonth.profit),

        cashBalance: (restaurant.currentBalance?.cash || 0) + (restaurant.currentBalance?.bank || 0),

        pendingPayments,
        pendingCount,

        monthly,
      },
    });
  } catch (error) {
    console.error('Finance Overview Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error in Finance Overview',
      error: error.message,
    });
  }
};

/**
 * @desc    Get Inventory for Kitchen Dashboard (Simplified)
 * @route   GET /api/finance/inventory/kitchen
 * @access  Protected (Kitchen Staff)
 */
const getKitchenInventory = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    
    // We only select fields the kitchen cares about (availability and stock)
    const inventory = await Inventory.find({ restaurantId })
      .select('name currentStock isAvailable unit category minStockLevel')
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      inventory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Kitchen inventory error' });
  }
};

/**
 * @desc    Toggle Item Availability (86-ing an item)
 * @route   PATCH /api/finance/inventory/:id/toggle
 * @access  Protected (Kitchen Staff)
 */
const toggleItemAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;

    const item = await Inventory.findOne({ _id: id, restaurantId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    // Broadcast to all terminals via Socket.io
    if (req.io) {
      req.io.to('kitchen').emit('INVENTORY_UPDATED', {
        itemId: item._id,
        isAvailable: item.isAvailable,
        currentStock: item.currentStock
      });
    }

    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle availability' });
  }
};

/**
 * @desc    Quick Stock Update (Deducting or adding stock)
 * @route   PATCH /api/finance/inventory/:id/stock
 * @access  Protected (Kitchen Staff)
 */
const updateStockLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const restaurantId = req.user.restaurantId;

    const item = await Inventory.findOneAndUpdate(
      { _id: id, restaurantId },
      { $inc: { currentStock: quantity } },
      { new: true }
    );

    // If stock hits 0, consider auto-toggling availability
    if (item.currentStock <= 0) {
      item.isAvailable = false;
      await item.save();
    }

    if (req.io) {
      req.io.to('kitchen').emit('INVENTORY_UPDATED', {
        itemId: item._id,
        isAvailable: item.isAvailable,
        currentStock: item.currentStock
      });
    }

    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Stock update failed' });
  }
};




// ASSET TYPE - INVESTING BUCKET MAPPING
const ASSET_TYPE_BUCKETS = {
  'Equipment & Tools': 'equipmentAndTools',
  'Kitchen Equipment': 'equipmentAndTools',
  'Vehicle': 'vehicles',
  'Furniture': 'furniture',
  'Machinery': 'machineries',
  'Building': 'building',
  'Land': 'land',
  'Renovation': 'facilityUpgrades',
  'Facility': 'facilityUpgrades',
};


const bucketForAssetType = (assetType) => ASSET_TYPE_BUCKETS[assetType] || 'facilityUpgrades';

// Categories that never represent a real cash movement
const CASH_IMPACT_EXCLUDED_CATEGORIES = [
  'ASSET_GAIN', 'ASSET_LOSS', 'COGS', 'OPENING_BALANCE',
  'OPENING_STOCK', 'OPENING_ASSET', 'OPENING_LOAN', 'OPENING_CAPITAL',
];


// Compute running cash+bank balance as of any date
const computeCashBalanceAsOf = async (restaurantObjId, asOfDate) => {
  // Fetch the opening balance transaction
  const openingTxn = await Transaction.findOne({
    restaurant: restaurantObjId,
    category: 'OPENING_BALANCE',
  }).sort({ date: 1 });

  if (!openingTxn) return 0;

  const openingCash = (openingTxn.details?.cashComponent || 0) + (openingTxn.details?.bankComponent || 0);
  const openingDate = openingTxn.date;

  // Normalize dates to start-of-day for accurate comparison
  const normalizedAsOf = new Date(asOfDate);
  const normalizedOpening = new Date(openingDate);
  normalizedOpening.setHours(0, 0, 0, 0);

  // If the query date is strictly before the opening date, balance is 0
  if (normalizedAsOf < normalizedOpening) return 0;

  // Roll forward all completed transactions after the opening setup
  const flowAgg = await Transaction.aggregate([
    {
      $match: {
        restaurant: restaurantObjId,
        status: 'COMPLETED',
        category: { $nin: CASH_IMPACT_EXCLUDED_CATEGORIES },
        _id: { $ne: openingTxn._id }, // Exclude the opening transaction itself
        date: { $gte: openingDate, $lte: asOfDate },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [{ $eq: ['$type', 'EXPENSE'] }, { $multiply: ['$amount', -1] }, '$amount'],
          },
        },
      },
    },
  ]);

  return openingCash + (flowAgg[0]?.total || 0);
};

// @desc    Get Cash Flow Statement (standard accounting format)
// @route   GET /api/finance/cash-flows
const getCashFlow = async (req, res) => {
  try {
    const { period = 'thisMonth', startDate, endDate } = req.query;
    const restaurantId = req.user.restaurantId;
    const restaurantObjId = new mongoose.Types.ObjectId(restaurantId);

    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate); start.setHours(0, 0, 0, 0);
      end   = new Date(endDate);   end.setHours(23, 59, 59, 999);
    } else {
      ({ start, end } = getDateRange(period));
    }

    // Initial Cash Balance (Opening Balance for the period)
    const dayBeforeStart = new Date(start.getTime() - 1);
    const initialCashBalance = await computeCashBalanceAsOf(restaurantObjId, dayBeforeStart);

    // OPERATING ACTIVITIES
    const salesAgg = await Transaction.aggregate([
      { $match: { restaurant: restaurantObjId, type: 'INCOME', category: 'SALES', status: 'COMPLETED', date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const collectFromSales = salesAgg[0]?.total || 0;

    const expenseAgg = await Expense.aggregate([
      { $match: { restaurantId: restaurantObjId, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    const expMap = expenseAgg.reduce((acc, e) => { acc[e._id] = e.total; return acc; }, {});

    const payrollSalaries = expMap['Salaries']    || 0;
    const utilities       = expMap['Utilities']   || 0;
    const tax             = expMap['Taxes']       || 0;
    const insurance       = expMap['Insurance']   || 0;
    const rent            = expMap['Rent']        || 0;
    const marketing       = expMap['Marketing']   || 0;
    const maintenance     = expMap['Maintenance'] || 0;
    const supplies        = expMap['Supplies']    || 0;
    const cleaning        = expMap['Cleaning']    || 0;
    const delivery        = expMap['Delivery']    || 0;
    const other           = expMap['Other']       || 0;

    // Inventory Purchases (exclude linked expense entries to prevent double counting)
    const purchaseAgg = await Transaction.aggregate([
      { $match: { restaurant: restaurantObjId, category: 'PURCHASE', status: 'COMPLETED', date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalPurchaseTxns = purchaseAgg[0]?.total || 0;

    const linkedSuppliesAgg = await Expense.aggregate([
      { $match: { restaurantId: restaurantObjId, category: { $in: ['Supplies', 'Ingredients'] }, transactionRef: { $ne: null }, date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const linkedSupplies = linkedSuppliesAgg[0]?.total || 0;
    const inventoryPurchase = Math.max(0, totalPurchaseTxns - linkedSupplies);

    const totalOperatingOutflows = payrollSalaries + utilities + inventoryPurchase + tax + insurance
      + rent + marketing + maintenance + supplies + cleaning + delivery + other;

    // Corrected Net Operating Cash Flow (Activity only)
    const netOperatingCash = collectFromSales - totalOperatingOutflows;

    // INVESTING ACTIVITIES
    const assetPurchases = await Asset.find({
      restaurantId: restaurantObjId,
      purchaseDate: { $gte: start, $lte: end },
      isInitial: { $ne: true },
    });

    const investingBuckets = {
      equipmentAndTools: 0, vehicles: 0, furniture: 0, machineries: 0,
      building: 0, land: 0, facilityUpgrades: 0,
    };
    assetPurchases.forEach((a) => {
      investingBuckets[bucketForAssetType(a.assetType)] += a.purchaseCost || 0;
    });

    const investmentOutAgg = await Transaction.aggregate([
      { $match: { restaurant: restaurantObjId, category: 'INVESTMENT_OUT', status: 'COMPLETED', date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const externalInvestment = investmentOutAgg[0]?.total || 0;

    const assetDisposalAgg = await Transaction.aggregate([
      { $match: { restaurant: restaurantObjId, category: 'ASSET_DISPOSAL', status: 'COMPLETED', date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const assetSaleProceeds = assetDisposalAgg[0]?.total || 0;

    const totalInvestingOutflows = Object.values(investingBuckets).reduce((s, v) => s + v, 0) + externalInvestment;
    const netInvestingCash = assetSaleProceeds - totalInvestingOutflows;

    // FINANCING ACTIVITIES
    const financingAgg = await Transaction.aggregate([
      {
        $match: {
          restaurant: restaurantObjId,
          category: { $in: ['LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'INVESTMENT_IN', 'OWNER_INVESTMENT', 'OWNER_DRAWING'] },
          status: 'COMPLETED',
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    const finMap = financingAgg.reduce((acc, r) => { acc[r._id] = r.total; return acc; }, {});

    const loanProceeds         = finMap.LOAN_DISBURSEMENT || 0;
    const loanRepaymentsFull   = finMap.LOAN_REPAYMENT || 0;
    const ownerInvestorCapital = (finMap.INVESTMENT_IN || 0) + (finMap.OWNER_INVESTMENT || 0);
    const ownerDrawings        = finMap.OWNER_DRAWING || 0;

    const netFinancingCash = loanProceeds - loanRepaymentsFull + ownerInvestorCapital - ownerDrawings;

    // NET CHANGE & CLOSING BALANCE
    const netCashChange = netOperatingCash + netInvestingCash + netFinancingCash;
    const closingBalance = initialCashBalance + netCashChange;

    const monthly = await buildMonthlyCashFlow(restaurantId, restaurantObjId);

    res.status(200).json({
      success: true,
      period,
      initialCashBalance,
      operating: {
        collectFromSales, payrollSalaries, utilities, inventoryPurchase, tax,
        insurance, rent, marketing, maintenance, supplies, cleaning, delivery, other,
      },
      netOperatingCash,
      investing: { ...investingBuckets, externalInvestment, assetSaleProceeds },
      netInvestingCash,
      financing: { loanProceeds, loanRepaymentsFull, ownerInvestorCapital, ownerDrawings },
      netFinancingCash,
      netCashChange,
      closingBalance,
      monthly,
    });
  } catch (error) {
    console.error('Cash flow error:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// HELPER: Parallelized 6-Month Cash Flow Trend
const buildMonthlyCashFlow = async (restaurantId, restaurantObjId) => {
  const monthPromises = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const label = start.toLocaleString('default', { month: 'short' });

    const monthQuery = (async () => {
      const [salesAgg, purchaseAgg, otherExpenseAgg, assetAgg, disposalAgg, finAgg] = await Promise.all([
        Transaction.aggregate([
          { $match: { restaurant: restaurantObjId, type: 'INCOME', category: 'SALES', status: 'COMPLETED', date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { restaurant: restaurantObjId, category: 'PURCHASE', status: 'COMPLETED', date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Expense.aggregate([
          { $match: { restaurantId: restaurantObjId, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Asset.aggregate([
          { $match: { restaurantId: restaurantObjId, purchaseDate: { $gte: start, $lte: end }, isInitial: { $ne: true } } },
          { $group: { _id: null, total: { $sum: '$purchaseCost' } } },
        ]),
        Transaction.aggregate([
          { $match: { restaurant: restaurantObjId, category: 'ASSET_DISPOSAL', status: 'COMPLETED', date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          {
            $match: {
              restaurant: restaurantObjId,
              category: { $in: ['LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'INVESTMENT_IN', 'OWNER_INVESTMENT', 'OWNER_DRAWING'] },
              status: 'COMPLETED',
              date: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
        ]),
      ]);

      const finMap = finAgg.reduce((acc, r) => { acc[r._id] = r.total; return acc; }, {});
      const operating = (salesAgg[0]?.total || 0) - (purchaseAgg[0]?.total || 0) - (otherExpenseAgg[0]?.total || 0);
      const investing = (disposalAgg[0]?.total || 0) - (assetAgg[0]?.total || 0);
      const financing = (finMap.LOAN_DISBURSEMENT || 0) - (finMap.LOAN_REPAYMENT || 0) +
                        (finMap.INVESTMENT_IN || 0) + (finMap.OWNER_INVESTMENT || 0) - (finMap.OWNER_DRAWING || 0);

      return { month: label, operating, investing, financing };
    })();

    monthPromises.push(monthQuery);
  }

  return Promise.all(monthPromises);
};

// @desc    Get Capital Transactions (Loans, Investments, Owner Equity) + summary totals
// @route   GET /api/finance/capital-transactions?period=&category=
const getCapitalTransactions = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { period, category, startDate, endDate } = req.query;

    const filter = {
      restaurant: restaurantId,
      category: { $in: ALL_CAPITAL_CATEGORIES },
    };

    if (category && category !== 'all' && TAB_CATEGORY_GROUPS[category]) {
      filter.category = { $in: TAB_CATEGORY_GROUPS[category] };
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (period) {
      const { start, end } = getDateRange(period);
      filter.date = { $gte: start, $lte: end };
    }

    const docs = await Transaction.find(filter).sort({ date: -1 });

    const transactions = docs.map((t) => ({
      _id: t._id,
      date: t.date,
      description: t.description,
      type: CATEGORY_TO_FRONTEND_TYPE[t.category] || t.category,
      sourceOrDestination: t.details?.counterparty || '—',
      paymentMethod: t.paymentMethod,
      amount: t.amount,
    }));

    // Totals reflect the FULL capital ledger regardless of the active tab,
    // so summary cards stay stable while the table below filters
    const totalsAgg = await Transaction.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          category: { $in: ALL_CAPITAL_CATEGORIES },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    const sums = totalsAgg.reduce((acc, row) => {
      acc[row._id] = row.total;
      return acc;
    }, {});

    const totals = {
      activeLoans: (sums.LOAN_DISBURSEMENT || 0) + (sums.OPENING_LOAN || 0) - (sums.LOAN_REPAYMENT || 0),
      externalInvestmentsIn: sums.INVESTMENT_IN || 0,
      externalInvestmentsOut: sums.INVESTMENT_OUT || 0,
      netOwnerEquity: (sums.OWNER_INVESTMENT || 0) + (sums.OPENING_CAPITAL || 0) - (sums.OWNER_DRAWING || 0),
    };

    res.status(200).json({ success: true, data: { transactions, totals } });
  } catch (error) {
    console.error('Get capital transactions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active loans with computed remaining balance
// @route   GET /api/finance/loans/active
const getActiveLoans = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const restaurantObjId = new mongoose.Types.ObjectId(restaurantId);

    // Every disbursement IS a loan record
    const disbursements = await Transaction.find({
      restaurant: restaurantObjId,
      category: { $in: ['LOAN_DISBURSEMENT', 'OPENING_LOAN'] },
    }).sort({ date: -1 });

    // Sum all repayments, grouped by which disbursement they're paying off
    const repaymentTotals = await Transaction.aggregate([
      { $match: { restaurant: restaurantObjId, category: 'LOAN_REPAYMENT' } },
      { $group: { _id: '$details.loanReferenceId', totalPaid: { $sum: '$amount' } } },
    ]);

    const repaidMap = repaymentTotals.reduce((acc, r) => {
      acc[String(r._id)] = r.totalPaid;
      return acc;
    }, {});

    const loans = disbursements.map((d) => {
      const totalPaid = repaidMap[String(d._id)] || 0;
      const remainingBalance = Math.max(0, d.amount - totalPaid);
      return {
        id: d._id,
        lenderName: d.details?.counterparty || 'Unknown Lender',
        principalAmount: d.amount,
        remainingBalance,
        totalPaid,
        interestRate: d.details?.interestRate || 0,
        durationMonths: d.details?.durationMonths || 0,
        monthlyInstallment: d.details?.monthlyInstallment || 0,
        disbursementDate: d.date,
        status: remainingBalance <= 0.01 ? 'Paid Off' : 'Active',
      };
    });

    // Only send back loans still owed - that's what the repayment dropdown needs
    const activeLoans = loans.filter((l) => l.status === 'Active');

    res.status(200).json({ success: true, data: { activeLoans, allLoans: loans } });
  } catch (error) {
    console.error('Get active loans error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record a new Capital transaction (Loan, Investment, or Owner Equity movement)
// @route   POST /api/finance/capital-transactions
const createCapitalTransaction = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const {
      type, amount, description, sourceOrDestination,
      paymentMethod, date, loanDetails, referenceId
    } = req.body;

    const mapping = CAPITAL_TYPE_MAP[type];
    if (!mapping) {
      return res.status(400).json({ success: false, message: `Invalid capital transaction type: ${type}` });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid amount is required.' });
    }
    if (!sourceOrDestination || !sourceOrDestination.trim()) {
      return res.status(400).json({ success: false, message: 'Counterparty is required.' });
    }

    let originalLoan = null;
    let remainingBalance = 0;
    let interestPortion = 0;
    let principalPortion = Number(amount);

    if (type === 'Loan_Repayment') {
      if (!referenceId) {
        return res.status(400).json({ success: false, message: 'A target loan must be selected for repayment.' });
      }

      originalLoan = await Transaction.findOne({
        _id: referenceId,
        restaurant: restaurantId,
        category: { $in: ['LOAN_DISBURSEMENT', 'OPENING_LOAN'] },
      });
      if (!originalLoan) {
        return res.status(404).json({ success: false, message: 'Referenced loan not found.' });
      }

      const paidSoFarAgg = await Transaction.aggregate([
        {
          $match: {
            restaurant: new mongoose.Types.ObjectId(restaurantId),
            category: 'LOAN_REPAYMENT',
            'details.loanReferenceId': String(referenceId),
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const paidSoFar = paidSoFarAgg[0]?.total || 0;
      remainingBalance = originalLoan.amount - paidSoFar;

      if (Number(amount) > remainingBalance + 0.01) {
        return res.status(400).json({
          success: false,
          message: `Repayment of Rs. ${Number(amount).toLocaleString()} exceeds remaining balance of Rs. ${remainingBalance.toLocaleString()}.`,
        });
      }

      // Split the EMI into interest (P&L expense) and principal (reduces liability)
      const monthlyRate = ((originalLoan.details?.interestRate || 0) / 100) / 12;
      interestPortion = Math.min(+(remainingBalance * monthlyRate).toFixed(2), Number(amount));
      principalPortion = +(Number(amount) - interestPortion).toFixed(2);
    }

    const paymentMethodMap = {
      'Cash': 'CASH',
      'Bank_Transfer': 'BANK_TRANSFER',
      'Cheque': 'BANK_TRANSFER',
      'Other': 'CASH',
    };
    const mappedPaymentMethod = paymentMethodMap[paymentMethod] || 'BANK_TRANSFER';

    const transaction = await Transaction.create({
      restaurant: restaurantId,
      user: req.user.id,
      type: mapping.type,
      category: mapping.category,
      amount: Number(amount),
      paymentMethod: mappedPaymentMethod,
      description: description?.trim() || type.replace('_', ' '),
      date: date || new Date(),
      status: 'COMPLETED',
      details: {
        counterparty: sourceOrDestination.trim(),
        referenceNumber: `CAP-${Date.now()}`,
        ...(type === 'Loan_Disbursement' && loanDetails && {
          interestRate: loanDetails.interestRate,
          durationMonths: loanDetails.durationMonths,
          monthlyInstallment: loanDetails.monthlyInstallment,
          debtBucket: (loanDetails.durationMonths && loanDetails.durationMonths <= 12)
            ? 'shortTermDebt' : 'longTermLoans',
        }),
        ...(type === 'Loan_Repayment' && {
          loanReferenceId: String(referenceId),
          principalPortion,
          interestPortion,
        }),
      },
    });

    // Interest is a genuine operating expense - record it in the Expense collection
    // so it flows into P&L and cash-flow reports the same way any other opex does.
    if (type === 'Loan_Repayment' && interestPortion > 0) {
      await Expense.create({
        date: date || new Date(),
        amount: interestPortion,
        category: 'Interest', 
        description: `Interest portion of repayment to ${sourceOrDestination}`,
        paidTo: sourceOrDestination,
        paymentMethod: paymentMethod || 'Bank_Transfer',
        addedBy: req.user.id,
        restaurantId,
      });
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Create capital transaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Purchase / Record a new fixed asset
// @route   POST /api/finance/assets/purchase
const purchaseAsset = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const {
      name, assetType, purchaseDate, purchaseCost,
      usefulLife, depreciationMethod, salvageValue,
      currentValue, isInitial, notes, paymentMethod,
      paymentStatus = 'Paid', dueDate, supplier,
    } = req.body;

    const asset = await Asset.create({
      restaurantId,
      name,
      assetType,
      purchaseDate: purchaseDate || new Date(),
      purchaseCost: Number(purchaseCost),
      usefulLife:   Number(usefulLife) || null,
      depreciationMethod: depreciationMethod || 'straight-line',
      salvageValue: Number(salvageValue) || 0,
      currentValue: Number(currentValue) || Number(purchaseCost),
      isInitial:    Boolean(isInitial),
      notes:        notes || '',
      status:       'Active',
    });

    
    const paymentMethodMap = {
      'Cash': 'CASH', 'Bank_Transfer': 'BANK_TRANSFER',
      'Cheque': 'BANK_TRANSFER', 'Card': 'CARD', 'Other': 'CASH',
    };
    const isPending = paymentStatus === 'Unpaid';

    await Transaction.create({
      restaurant: restaurantId,
      user: req.user.id,
      type: 'EXPENSE',
      category: 'ASSET_PURCHASE',
      amount: Number(purchaseCost),
      paymentMethod: paymentMethodMap[paymentMethod] || 'BANK_TRANSFER',
      description: isInitial ? `Opening fixed asset: ${name}` : `Purchased fixed asset: ${name}`,
      date: purchaseDate || new Date(),
      status: isPending ? 'PENDING' : 'COMPLETED',
      isSystemGenerated: true,
      details: {
        assetId: asset._id,
        counterparty: supplier || 'Unknown Supplier',  
        dueDate: isPending ? (dueDate || null) : null, 
        isInitialSetup: !!isInitial, 
        referenceNumber: `AST-${Date.now()}`,
      },
    });
    

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    console.error('Purchase asset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Sell / Dispose of an asset and record gain or loss
// @route   POST /api/finance/assets/:id/sell
const sellAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { salePrice, saleDate, notes, paymentMethod } = req.body;
    const restaurantId = req.user.restaurantId;

    const asset = await Asset.findOne({ _id: id, restaurantId });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    if (asset.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Only active assets can be sold' });
    }

    const bookValueAtSale = asset.bookValue ?? asset.currentValue ?? asset.purchaseCost;
    const gainLoss = Number(salePrice) - bookValueAtSale;

    asset.status    = 'Sold';
    asset.salePrice = Number(salePrice);
    asset.saleDate  = saleDate  || new Date();
    asset.gainLoss  = +gainLoss.toFixed(2);
    if (notes) asset.notes = notes;

    await asset.save();

    const paymentMethodMap = {
      'Cash': 'CASH', 'Bank_Transfer': 'BANK_TRANSFER',
      'Cheque': 'BANK_TRANSFER', 'Card': 'CARD', 'Other': 'CASH',
    };
    const mappedMethod = paymentMethodMap[paymentMethod] || 'BANK_TRANSFER';

    // Record the disposal as a transaction so it appears in P&L
    await Transaction.create({
      restaurant: restaurantId,
      user: req.user.id,
      type: 'INCOME',
      category: 'ASSET_DISPOSAL',
      amount: Number(salePrice),
      paymentMethod: mappedMethod,
      description: `Sold fixed asset: ${asset.name}`,
      date: asset.saleDate,
      status: 'COMPLETED',
      isSystemGenerated: true,
      details: {
        assetId: asset._id,
        assetBookValueAtSale: bookValueAtSale,
        referenceNumber: `DISP-${Date.now()}`,
      },
    });

    await Transaction.create({
      restaurant: restaurantId,
      user: req.user.id,
      type: gainLoss >= 0 ? 'INCOME' : 'EXPENSE',
      category: gainLoss >= 0 ? 'ASSET_GAIN' : 'ASSET_LOSS',
      amount: Math.abs(gainLoss),
      description: `Asset disposal: ${asset.name} — ${gainLoss >= 0 ? 'Gain' : 'Loss'} on sale`,
      date: asset.saleDate,
      status: 'COMPLETED',
      isSystemGenerated: true,
      details: {
        assetId: asset._id,
        salePrice: Number(salePrice),
        bookValue: bookValueAtSale,
        gainLoss,
        referenceNumber: `GL-${Date.now()}`,
      },
    });

    res.status(200).json({ success: true, data: asset.toObject() });
  } catch (error) {
    console.error('Sell asset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const recordTransaction = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { date, description, category, amount, paidTo, paymentMethod, type } = req.body;

    // Server-side validation
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid amount is required.' });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }
    if (!description || description.trim() === '') {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    const categoryMap = {
      'Salaries':    'SALARY',
      'Rent':        'RENT',
      'Utilities':   'UTILITY',
      'Ingredients': 'PURCHASE',
      'Marketing':   'OTHER',
      'Maintenance': 'MAINTENANCE',
      'Supplies':    'PURCHASE',
      'Taxes':       'TAX',
      'Insurance':   'OTHER',
      'Cleaning':    'OTHER',
      'Delivery':    'OTHER',
      'Sales':       'SALES',
      'Investment':  'OTHER',
      'Refund':      'OTHER',
      'Other':       'OTHER',
    };

    const paymentMethodMap = {
      'Cash': 'CASH',
      'Bank Transfer': 'BANK_TRANSFER',
      'Card': 'CARD',
      'Cheque': 'BANK_TRANSFER',
      'Other': 'CASH',
    };

    const transaction = await Transaction.create({
      restaurant: restaurantId,
      user: req.user.id,
      type: type === 'expense' ? 'EXPENSE' : 'INCOME',
      category: categoryMap[category] || 'OTHER',
      amount: Number(amount),
      paymentMethod: paymentMethodMap[paymentMethod] || 'CASH',
      description: description.trim(),
      details: { referenceNumber: `TXN-${Date.now()}` },
      date: date || new Date(),
      status: 'COMPLETED',
    });

    if (type === 'expense') {
      await Expense.create({
        date: date || new Date(),
        amount: Number(amount),
        category: category || 'Other',
        description: description.trim(), 
        paidTo: paidTo || '',
        paymentMethod: paymentMethod || 'Cash',
        addedBy: req.user.id,
        restaurantId,
        transactionRef: transaction._id,
      });
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Record transaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit a manually-logged expense (correction, not system-generated)
// @route   PATCH /api/finance/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;
    const { amount, category, description, date, paidTo, paymentMethod } = req.body;

    const expense = await Expense.findOne({ _id: id, restaurantId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Guard: only allow editing expenses that have a linked, user-entered Transaction.
    let linkedTransaction = null;
    if (expense.transactionRef) {
      linkedTransaction = await Transaction.findOne({
        _id: expense.transactionRef,
        restaurant: restaurantId,
      });

      if (linkedTransaction?.isSystemGenerated) {
        return res.status(403).json({
          success: false,
          message: 'This entry was generated automatically by the system and cannot be manually edited.',
        });
      }
    }

    const oldAmount = expense.amount;
    const oldPaymentMethod = expense.paymentMethod;
    const newAmount = amount !== undefined ? Number(amount) : oldAmount;
    const newPaymentMethod = paymentMethod || oldPaymentMethod;

    // Update the Expense document (drives the Expenditures page)
    expense.amount = newAmount;
    expense.category = category ?? expense.category;
    expense.description = description ?? expense.description;
    expense.date = date ?? expense.date;
    expense.paidTo = paidTo ?? expense.paidTo;
    expense.paymentMethod = newPaymentMethod;
    expense.editedAt = new Date();          
    expense.editedBy = req.user.id;     
    await expense.save();

    // Update the linked Transaction's fields WITHOUT re-triggering post('save') balance logic
    if (linkedTransaction) {
      const categoryMap = {
        'Salaries': 'SALARY', 'Rent': 'RENT', 'Utilities': 'UTILITY',
        'Ingredients': 'PURCHASE', 'Marketing': 'OTHER', 'Maintenance': 'MAINTENANCE',
        'Supplies': 'PURCHASE', 'Taxes': 'TAX', 'Insurance': 'OTHER',
        'Cleaning': 'OTHER', 'Delivery': 'OTHER', 'Other': 'OTHER',
      };
      const paymentMethodMap = {
        'Cash': 'CASH', 'Bank Transfer': 'BANK_TRANSFER', 'Card': 'CARD',
        'Cheque': 'BANK_TRANSFER', 'Other': 'CASH',
      };

      await Transaction.findByIdAndUpdate(linkedTransaction._id, {
        $set: {
          amount: newAmount,
          category: categoryMap[category] || linkedTransaction.category,
          description: description ?? linkedTransaction.description,
          date: date ?? linkedTransaction.date,
          paymentMethod: paymentMethodMap[newPaymentMethod] || linkedTransaction.paymentMethod,
        },
      }); // findByIdAndUpdate does NOT run post('save') — balance is untouched by this call

      // Manually apply the DELTA to the restaurant's balance
      
      const oldMapped = { 'Cash': 'CASH', 'Bank Transfer': 'BANK_TRANSFER', 'Card': 'CARD', 'Cheque': 'BANK_TRANSFER', 'Other': 'CASH' }[oldPaymentMethod] || 'CASH';
      const newMapped = { 'Cash': 'CASH', 'Bank Transfer': 'BANK_TRANSFER', 'Card': 'CARD', 'Cheque': 'BANK_TRANSFER', 'Other': 'CASH' }[newPaymentMethod] || 'CASH';

      const balanceInc = {};
      const oldField = oldMapped === 'CASH' ? 'currentBalance.cash' : 'currentBalance.bank';
      const newField = newMapped === 'CASH' ? 'currentBalance.cash' : 'currentBalance.bank';

      // Reverse old expense impact (add old amount back - it was subtracted at creation)
      balanceInc[oldField] = (balanceInc[oldField] || 0) + oldAmount;
      // Apply new expense impact (subtract new amount)
      balanceInc[newField] = (balanceInc[newField] || 0) - newAmount;
      // Total balance moves by the net of the two
      balanceInc['currentBalance.total'] = (balanceInc['currentBalance.cash'] || 0) + (balanceInc['currentBalance.bank'] || 0);

      await Restaurant.findByIdAndUpdate(restaurantId, { $inc: balanceInc });
    }

    res.status(200).json({
      success: true,
      data: expense,
      balanceAdjusted: !!linkedTransaction,
      message: linkedTransaction
        ? 'Expense corrected and balance adjusted.'
        : 'Expense corrected, but no linked ledger entry was found — balance was NOT adjusted for this record.',
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { format = 'csv', period, category, startDate, endDate } = req.query;
    const restaurantId = req.user.restaurantId;

    let rows = [];
    let columns = [];
    let pdfRows = [];    
    let summary = {};
    let filenameBase = reportType;
    let periodLabel = period ? `Period: ${period}` : (startDate && endDate ? `${startDate} to ${endDate}` : '');
    let title = 'Finance Report';

    switch (reportType) {
      case 'capital': {
        const filter = { restaurant: restaurantId, category: { $in: ALL_CAPITAL_CATEGORIES } };

        if (category && category !== 'all' && TAB_CATEGORY_GROUPS[category]) {
          filter.category = { $in: TAB_CATEGORY_GROUPS[category] };
        }
        if (startDate && endDate) {
          const s = new Date(startDate); s.setHours(0, 0, 0, 0);
          const e = new Date(endDate); e.setHours(23, 59, 59, 999);
          filter.date = { $gte: s, $lte: e };
        } else if (period) {
          const { start, end } = getDateRange(period);
          filter.date = { $gte: start, $lte: end };
        }

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

      case 'sales': {
        let start, end;
        if (startDate && endDate) {
          start = new Date(startDate); start.setHours(0, 0, 0, 0);
          end = new Date(endDate); end.setHours(23, 59, 59, 999);
        } else {
          ({ start, end } = getDateRange(period || 'thisMonth'));
        }
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

      case 'expenses': {
        let start, end;
        if (startDate && endDate) {
          start = new Date(startDate); start.setHours(0, 0, 0, 0);
          end = new Date(endDate); end.setHours(23, 59, 59, 999);
        } else if (period) {
          ({ start, end } = getDateRange(period));
        }
        const filter = { restaurantId };
        if (start && end) filter.date = { $gte: start, $lte: end };

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

      default: {
        return res.status(400).json({
          success: false,
          message: `Export for report type "${reportType}" isn't implemented yet.`,
        });
      }
    }

    if (format === 'pdf') {
      const restaurant = await Restaurant.findById(restaurantId).select('name');
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

    return res.status(501).json({
      success: false,
      message: `Export format "${format}" isn't supported — use "csv" or "pdf".`,
    });

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
  buildMonthlyCashFlow,
  getCapitalTransactions,
  createCapitalTransaction,
  getActiveLoans,
  buildMonthlyPnL,
  updateExpense,
  exportReport,
  getDateRange,
  ALL_CAPITAL_CATEGORIES,
  TAB_CATEGORY_GROUPS,
  CATEGORY_TO_FRONTEND_TYPE,
  computeCashBalanceAsOf
};