const Order = require('../models/Order');
const Review = require('../models/Review');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const Table = require('../models/Table');
const mongoose = require('mongoose');

/**
 * GET DASHBOARD STATS
 * Aggregates multi-collection data for the Admin Dashboard
 */
exports.getDashboardStats = async (req, res) => {
  console.log('[Dashboard] NEW controller running');

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);

    // TIMEFRAMES
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // PARALLEL AGGREGATION 
    const [
      revenueData,
      activeOrdersCount,
      newCustomersToday,
      allTables,
      activeOrders,
      inventoryAlerts,
      weeklySales,
      reviewStats,
      recentCustomizedOrders,
      customerSegmentsData,
      totalCustomerCount
    ] = await Promise.all([

      Order.aggregate([
        {
          $match: {
            restaurantId,
            createdAt: { $gte: startOfToday, $lte: endOfToday },
            status: 'Completed'
          }
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),

      Order.countDocuments({
        restaurantId,
        status: { $in: ['Pending', 'Preparing', 'Ready'] }
      }),

      Customer.countDocuments({
        restaurantId,
        createdAt: { $gte: startOfToday }
      }),

      Table.find({ restaurantId, status: { $ne: 'Inactive' } })
        .select('tableNumber capacity status currentOrderId')
        .sort({ tableNumber: 1 })
        .lean(),

      Order.find({
        restaurantId,
        status: { $in: ['Pending', 'Preparing', 'Ready'] }
      })
        .select('tableId status')
        .lean(),

      Inventory.find({
        restaurantId,
        $or: [
          { $expr: { $lte: ['$currentStock', '$minimumStock'] } },
          { expiryDate: { $lte: new Date() } }
        ]
      })
        .select('name currentStock minimumStock expiryDate')
        .limit(5)
        .lean(),

      Order.aggregate([
        {
          $match: {
            restaurantId,
            createdAt: { $gte: sevenDaysAgo },
            status: 'Completed'
          }
        },
        {
          $group: {
            _id: { $dayOfWeek: '$createdAt' },
            sales: { $sum: '$totalPrice' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Review.aggregate([
        { $match: { restaurantId } },
        { $group: { _id: null, avgScore: { $avg: '$sentiment.score' } } }
      ]),

      Order.find({
        restaurantId,
        'items.customizations.0': { $exists: true }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Customer.aggregate([
        { $match: { restaurantId, isActive: true } },
        { $group: { _id: '$segment', count: { $sum: 1 } } }
      ]),

      Customer.countDocuments({ restaurantId })
    ]);
    console.log('[DEBUG] Active order tableId values:',
      activeOrders.map(o => ({ tableId: o.tableId, type: typeof o.tableId }))
    );
    console.log('[DEBUG] All table records:',
      allTables.map(t => ({ _id: t._id.toString(), tableNumber: t.tableNumber }))
    );

    // TABLE STATUS MERGE 

    const occupiedByObjectId = new Set(
      activeOrders
        .map(o => o.tableId?.toString().trim())
        .filter(Boolean)
    );

    const occupiedByTableNumber = new Set(
      activeOrders
        .map(o => o.tableId?.toString().trim())
        .filter(Boolean)
    );

    console.log('[DEBUG] Occupied set values:', [...occupiedByObjectId]);

    const tablesWithStatus = allTables.map(table => {
      const tableObjectIdStr = table._id.toString();
      const tableNumberStr   = table.tableNumber.toString().trim();

      
      const isOccupied =
        occupiedByObjectId.has(tableObjectIdStr) ||
        occupiedByTableNumber.has(tableNumberStr);

      let liveStatus;
      if (isOccupied) {
        liveStatus = 'Occupied';
      } else if (table.status === 'Reserved') {
        liveStatus = 'Reserved';
      } else {
        liveStatus = 'Available';
      }

      return {
        _id:         table._id,
        tableNumber: table.tableNumber,
        capacity:    table.capacity,
        status:      liveStatus,
      };
    });

    //  SEGMENT MAPPING 
    const segments = {New: 0, vips: 0, regulars: 0, atRisk: 0 };

    customerSegmentsData.forEach(seg => {
      if (!seg._id) return;
      const label = seg._id.toString().toLowerCase().trim();

      if (label === 'vip' || label === 'loyal') {
        segments.vips += seg.count;
      } else if (label === 'new') {
        segments.New += seg.count;      
      } else if (label === 'regular') {
        segments.regulars += seg.count;
      } else if (label === 'at-risk' || label === 'inactive') {
        segments.atRisk += seg.count;
      }
    });

    // SALES TREND 
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedSalesTrend = dayLabels.map((day, idx) => {
      const found = weeklySales.find(item => item._id === idx + 1);
      return { name: day, sales: found ? found.sales : 0 };
    });

    //SENTIMENT 
    const rawScore = reviewStats[0]?.avgScore ?? 0;
    const sentimentPercentage = Math.round((rawScore + 1) * 50);

    //  INVENTORY ALERTS 
    const now = new Date();
    const mappedInventoryAlerts = inventoryAlerts.map(item => ({
      name:         item.name,
      currentStock: item.currentStock,
      minThreshold: item.minimumStock,
      isExpired:    item.expiryDate ? item.expiryDate <= now : false
    }));

    //  RECENT CUSTOMIZATIONS 
    const mappedCustomizations = recentCustomizedOrders.map(order => ({
      name: order.items?.[0]?.name || 'Custom Order',
      note: order.items?.[0]?.customizations?.join(', ') || 'No specific notes',
      type: 'AI Suggestion'
    }));

    // FINAL RESPONSE 
    console.log(`[Dashboard] Stats aggregated for Restaurant: ${restaurantId}`);
    console.log('[Dashboard] Tables with status:', tablesWithStatus);

    return res.status(200).json({
      success: true,
      data: {
        todayRevenue:         revenueData[0]?.total || 0,
        activeOrders:         activeOrdersCount,
        newCustomers:         newCustomersToday,
        sentimentScore:       sentimentPercentage,
        segments,
        totalCustomers:       totalCustomerCount,
        vipCount:             segments.vips,
        activeTables:         tablesWithStatus,
        inventoryAlerts:      mappedInventoryAlerts,
        salesTrend:           formattedSalesTrend,
        recentCustomizations: mappedCustomizations
      }
    });

  } catch (error) {
    console.error('[Dashboard] Aggregation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      details: error.message
    });
  }
};