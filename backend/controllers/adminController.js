const Customer = require('../models/Customer');
const Order = require('../models/Order');
const axios = require('axios');
const mongoose = require('mongoose');

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:5001';

/**
 * GET ALL CUSTOMERS
 * Supports pagination, search, and status filtering for CustomerList.jsx
 */
const getCustomers = async (req, res) => {
  // Headers to ensure fresh data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const { page = 1, limit = 10, search = '', status } = req.query;

    // Identify the Restaurant Context
    const rawId = req.user?.restaurantId || req.user?.id; 
    
    if (!rawId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No Restaurant ID" });
    }

    // FLEXIBLE ID MATCHING
    // This allows matching "699d52..." (ObjectId) AND "RES-DEVELOPMENT-ID" (String)
    let restaurantIdQuery;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      restaurantIdQuery = new mongoose.Types.ObjectId(rawId);
    } else {
      restaurantIdQuery = rawId; 
    }

    // Build the Query
    // We use an $or for isActive to handle your older records that don't have the field yet
    let query = { 
      restaurantId: restaurantIdQuery,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } } 
      ]
    };

    // Apply Search Filters
    if (search) {
      query.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Handle Status Toggles from Frontend
    if (status === 'blocked') {
      delete query.$or;
      query.isActive = false;
    }

    // Execute with Pagination
    const [customers, totalCount] = await Promise.all([
      Customer.find(query)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Customer.countDocuments(query)
    ]);

    // Final Response
    res.status(200).json({
      success: true,
      customers,
      totalCount,
      page: Number(page),
      pageSize: Number(limit)
    });

  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};


// @desc    Get a single customer's full profile + order history
// @route   GET /api/admin/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const rawId = req.user?.restaurantId || req.user?.id;
    const restaurantIdQuery = mongoose.Types.ObjectId.isValid(rawId)
      ? new mongoose.Types.ObjectId(rawId)
      : rawId;

    const customer = await Customer.findOne({ _id: id, restaurantId: restaurantIdQuery }).lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Order history - most recent first, capped at 20 for the detail page
    const orders = await Order.find({ user: id })
      .select('totalPrice status createdAt items')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      customer: {
        ...customer,
        recentOrders: orders,
      },
    });
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching customer' });
  }
};

/**
 * TOGGLE CUSTOMER STATUS
 * Used for the "Block/Unblock" functionality
 */
const toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ customer: updatedCustomer });
  } catch (error) {
    res.status(500).json({ message: "Status update failed", error: error.message });
  }
};



/**
 * AI CUSTOMER SEGMENTATION (K-Means Bridge)
 * Aggregates RFM data and sends it to Python service
 */
const getCustomerSegments = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    // Fetch data directly from the Customer collection
    const customersForAi = await Customer.find(
      { restaurantId: restaurantId },
      '_id name phone totalSpent totalOrders lastVisit createdAt'
    ).lean();

    // K-Means requires at least 3 data points to perform clustering
    if (customersForAi.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient data. You have ${customersForAi.length} customers, but at least 3 are required for AI analysis.` 
      });
    }

    // Format data for the Python Service
    const formattedData = customersForAi.map(c => ({
      _id: c._id.toString(),
      phone: c.phone,
      totalSpent: c.totalSpent || 0,
      totalOrders: c.totalOrders || 0,
      lastVisit: c.lastVisit || c.createdAt 
    }));

    // Call the Python Scikit-learn Service
    const pythonResponse = await axios.post(`${PYTHON_AI_URL}/cluster-customers`, {
      customers: formattedData
    });

    if (pythonResponse.data && pythonResponse.data.detailed_data) {
      // Prepare Bulk Update for MongoDB
      const bulkOps = pythonResponse.data.detailed_data.map(item => ({
        updateOne: {
          filter: { _id: item._id },
          update: { 
            segment: item.segment, // "VIP", "Regular", or "At-Risk"
            updatedAt: new Date() 
          }
        }
      }));

      // Execute Bulk Write (Updates all 13+ customers in 1 single DB hit)
      if (bulkOps.length > 0) {
        await Customer.bulkWrite(bulkOps);
      }

      // Final Data Response - ALIGNED WITH REDUX & DASHBOARD
      // We map the python snake_case to the frontend camelCase/keys
      res.status(200).json({
        success: true,
        message: "AI Segmentation completed successfully",
        data: {
          segments: {
            vips: pythonResponse.data.clusters.vip_count || 0,
            regulars: pythonResponse.data.clusters.regular_count || 0,
            atRisk: pythonResponse.data.clusters.at_risk_count || 0
          }
        }
      });
    } else {
      throw new Error("Invalid response format from AI service");
    }

  } catch (error) {
    console.error("Segmentation Error Details:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: "AI Segmentation service unreachable or failed",
      error: error.message 
    });
  }
};

/**
 * GET DASHBOARD STATS
 * Provides KPIs for the Admin Landing Page
 */
const getDashboardStats = async (req, res) => {
  console.log('[Dashboard] NEW controller running');

  // Prevent 304 Not Modified — force fresh data every time
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

      // Today's completed revenue
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

      // Live active orders (Pending / Preparing / Ready)
      Order.countDocuments({
        restaurantId,
        status: { $in: ['Pending', 'Preparing', 'Ready'] }
      }),

      // New customers joined today
      Customer.countDocuments({
        restaurantId,
        createdAt: { $gte: startOfToday }
      }),

      // ALL tables for this restaurant (static records)
      Table.find({ restaurantId, status: { $ne: 'Inactive' } })
        .select('tableNumber capacity status currentOrderId')
        .sort({ tableNumber: 1 })
        .lean(),

      // Active orders — used to determine which tables are occupied
      Order.find({
        restaurantId,
        status: { $in: ['Pending', 'Preparing', 'Ready'] }
      })
        .select('tableId status')
        .lean(),

      // Low-stock or expired inventory items (uses actual model fields)
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

      // Weekly sales trend (last 7 days, completed orders only)
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

      // Average VADER sentiment score from reviews
      Review.aggregate([
        { $match: { restaurantId } },
        { $group: { _id: null, avgScore: { $avg: '$sentiment.score' } } }
      ]),

      // Recent orders that have customizations
      Order.find({
        restaurantId,
        'customizations.0': { $exists: true }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Customer segment distribution (active customers only)
      Customer.aggregate([
        { $match: { restaurantId, isActive: true } },
        { $group: { _id: '$segment', count: { $sum: 1 } } }
      ]),

      // Total customer count for this restaurant
      Customer.countDocuments({ restaurantId })
    ]);

    //  TABLE STATUS MERGE 
    // Build a Set of occupied tableIds for O(1) lookup
    const occupiedTableIds = new Set(
      activeOrders.map(o => o.tableId?.toString()).filter(Boolean)
    );

    // Attach live status to every table record
    const tablesWithStatus = allTables.map(table => {
      let liveStatus;

      if (occupiedTableIds.has(table._id.toString())) {
        liveStatus = 'Occupied';
      } else if (table.status === 'Reserved') {
        liveStatus = 'Reserved';   
      } else {
        liveStatus = 'Available';
      }

      return {
        _id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: liveStatus,
      };
    });

    //  SEGMENT MAPPING 
    // Normalize DB segment labels → frontend keys (vips, regulars, atRisk)
    const segments = { vips: 0, regulars: 0, atRisk: 0 };

    customerSegmentsData.forEach(seg => {
      if (!seg._id) return;
      const label = seg._id.toString().toLowerCase().trim();

      if (label === 'vip' || label === 'loyal') {
        segments.vips += seg.count;
      } else if (label === 'regular') {
        segments.regulars += seg.count;
      } else if (label === 'at-risk' || label === 'inactive') {
        segments.atRisk += seg.count;
      }
    });

    // SALES TREND MAPPING 
    // $dayOfWeek returns 1 (Sun) → 7 (Sat)
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedSalesTrend = dayLabels.map((day, idx) => {
      const found = weeklySales.find(item => item._id === idx + 1);
      return { name: day, sales: found ? found.sales : 0 };
    });

    // SENTIMENT SCORE 
    // VADER score is -1 to +1 → convert to 0–100% for the UI
    const rawScore = reviewStats[0]?.avgScore ?? 0;
    const sentimentPercentage = Math.round((rawScore + 1) * 50);

    //  INVENTORY ALERT MAPPING 
    const now = new Date();
    const mappedInventoryAlerts = inventoryAlerts.map(item => ({
      name: item.name,
      currentStock: item.currentStock,
      minThreshold: item.minimumStock,
      isExpired: item.expiryDate ? item.expiryDate <= now : false
    }));

    //  RECENT CUSTOMIZATIONS
    const mappedCustomizations = recentCustomizedOrders.map(order => ({
      name: order.items?.[0]?.name || 'Custom Order',
      note: order.items?.[0]?.customizations?.join(', ') || 'No specific notes',
      type: 'AI Suggestion'
    }));

    //  FINAL RESPONSE 
    console.log(`[Dashboard] Stats aggregated for Restaurant: ${restaurantId}`);

    return res.status(200).json({
      success: true,
      data: {
        // KPI Cards
        todayRevenue: revenueData[0]?.total || 0,
        activeOrders: activeOrdersCount,
        newCustomers: newCustomersToday,
        sentimentScore: sentimentPercentage,

        // Customer Segments (Doughnut Chart)
        segments,
        totalCustomers: totalCustomerCount,
        vipCount: segments.vips,

        // Table Overview (ALL tables with live status)
        activeTables: tablesWithStatus,

        // Inventory Alerts
        inventoryAlerts: mappedInventoryAlerts,

        // Revenue Trend (Line Chart) — full 7-day array, zeros filled
        salesTrend: formattedSalesTrend,

        // Recent AI Customizations
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

// @desc    Global quick search across Orders, MenuItems, Customers
// @route   GET /api/admin/search?q=...
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    const restaurantId = req.user.restaurantId;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, results: { orders: [], menuItems: [], customers: [] } });
    }

    const query = q.trim();
    const Order = require('../models/Order');
    const MenuItem = require('../models/MenuItem');
    const Customer = require('../models/Customer');

    const [orders, menuItems, customers] = await Promise.all([
      // Match by table number, or by the last 6 chars of the order ID (easier for staff to type/recall)
      Order.find({
        restaurantId,
        $expr: {
          $regexMatch: {
            input: { $toString: '$_id' },
            regex: query,
            options: 'i',
          },
        },
      })
        .select('tableId status totalPrice createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      MenuItem.find({
        restaurantId,
        name: { $regex: query, $options: 'i' },
      })
        .select('name category price isAvailable')
        .limit(5)
        .lean(),

      Customer.find({
        restaurantId,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } },
        ],
      })
        .select('name phone segment')
        .limit(5)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      results: { orders, menuItems, customers },
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};


module.exports = {
  getCustomers,
  getCustomerById,
  toggleCustomerStatus,
  getCustomerSegments,
  getDashboardStats,
  globalSearch,
};