const Order = require('../models/Order');
const Customer = require('../models/Customer');
const MenuItem = require('../models/MenuItem');
const { analyzeOrderText } = require('../utils/dialogflow.util');
const { processOrderInventory } = require('../utils/inventory.util');
const { sendBillEmail }    = require('../utils/email.util');
const { sendBillWhatsApp } = require('../utils/whatsapp.util');
const { generateBillPDF }  = require('../utils/billReceipt.util');
const Restaurant = require('../models/Restaurant');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// ROOM NAMING HELPERS
// Single source of truth - all socket rooms use these helpers
// Never hardcode room names anywhere else
const rooms = {
  kitchen:  (restaurantId) => `kitchen_${restaurantId}`,
  admin:    (restaurantId) => `admin_${restaurantId}`,
  customer: (phone)        => `customer_${phone.replace(/\D/g, '')}`,
};

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Public
 */
exports.createOrder = async (req, res) => {
  try {
    console.log('=== CREATE ORDER REQUEST ===');
    console.log(JSON.stringify(req.body, null, 2));

    const {
      restaurantId,
      tableId,
      customer: { name, phone, email },
      items,
      totalPrice,
      specialRequest = '',
    } = req.body;

    if (!restaurantId || !tableId || !phone || !items || items.length === 0 || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: restaurantId, tableId, phone, items, totalPrice',
      });
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    let customer = await Customer.findOne({ phone: normalizedPhone, restaurantId });

    if (!customer) {
      customer = await Customer.create({
        name: name.trim(),
        phone: normalizedPhone,
        restaurantId,
        email: email ? email.trim().toLowerCase() : null,
        lastVisit: new Date(),
        totalOrders: 1,
        totalSpent: totalPrice
      });
    } else {
      customer.name = name.trim();
      if (email) customer.email = email.trim().toLowerCase();
      customer.lastVisit = new Date();
      customer.totalOrders = (customer.totalOrders || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + totalPrice;
      if (customer.totalSpent > 10000) customer.segment = 'VIP';
      await customer.save();
    }

    const processedItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId).lean();

      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Menu item not found: ${item.name}`,
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Item "${item.name}" is currently unavailable`,
        });
      }

      const station = menuItem.station || 'Hot Station';

      processedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        qty: item.qty,
        station,
        customizations: Array.isArray(item.customizations)
          ? item.customizations
          : item.customizations
          ? [item.customizations]
          : [],
      });

      await MenuItem.findByIdAndUpdate(menuItem._id, {
        $inc: { totalSold: item.qty },
      });
    }

    const order = await Order.create({
      restaurantId,
      tableId,
      user: customer._id,
      items: processedItems,
      totalPrice,
      specialRequest,
      status: 'Pending',
      paymentMethod: 'Cash',
      isPaid: false
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name phone email segment');

    // Both rooms use consistent naming via helpers
    if (req.io) {
      req.io.to(rooms.kitchen(restaurantId)).emit('new-order', populatedOrder);
      req.io.to(rooms.kitchen(restaurantId)).emit('NEW_ORDER_RECEIVED', populatedOrder);
      req.io.to(rooms.admin(restaurantId)).emit('order-created', populatedOrder);
      console.log(`Real-time: Order ${order._id} → kitchen_${restaurantId} & admin_${restaurantId}`);
    }
    try {
      
      const notification = await Notification.create({
        restaurantId,
        type: 'new_order',
        title: 'New Order Received',
        message: `Table ${tableId} placed an order — Rs. ${totalPrice}`,
        relatedId: order._id,
        relatedType: 'Order',
      });

      if (req.io) {
        req.io.to(rooms.kitchen(restaurantId)).emit('NEW_NOTIFICATION', notification);
        req.io.to(rooms.admin(restaurantId)).emit('NEW_NOTIFICATION', notification);
      }
    } catch (notifErr) {
      console.error('Notification creation failed (non-blocking):', notifErr.message);
    }

    res.status(201).json({
      success: true,
      order: populatedOrder,
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while placing order',
    });
  }
};

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders
 * @access  Protected (Admin)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { restaurantId } = req.user; 
    const { status } = req.query;

    const filter = { restaurantId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name phone email segment')
      .sort({ createdAt: -1 });

    const [totalOrders, pending, preparing, ready, completed] = await Promise.all([
      Order.countDocuments({ restaurantId }),
      Order.countDocuments({ restaurantId, status: 'Pending' }),
      Order.countDocuments({ restaurantId, status: 'Preparing' }),
      Order.countDocuments({ restaurantId, status: 'Ready' }),
      Order.countDocuments({ restaurantId, status: 'Completed' }),
    ]);

    res.status(200).json({
      success: true,
      orders,
      stats: { totalOrders, pending, preparing, ready, completed },
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
};

/**
 * @desc    Get active orders for Kitchen Display System (KDS)
 * @route   GET /api/orders/kds/active
 * @access  Protected (Kitchen Staff)
 */
exports.getKDSActiveOrders = async (req, res) => {
  try {
    const { restaurantId } = req.user; 
    const { station } = req.query;

    const filter = {
      restaurantId,
      status: { $in: ['Pending', 'Preparing', 'Ready'] }, 
    };
    if (station && station !== 'All') {
      filter['items.station'] = station;
    }

    const orders = await Order.find({
      restaurantId,                                    
      status: { $in: ['Pending', 'Preparing', 'Ready'] }
    })
      .populate('user', 'name phone email segment')
      .sort({ createdAt: 1 }); // FIFO — oldest first

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('KDS Active Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active kitchen orders',
    });
  }
};

/**
 * @desc    Update order status or payment status
 * @route   PATCH /api/orders/:id/status
 * @access  Protected (Admin, Kitchen)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    const { status, isPaid } = req.body;
    const updateFields = {};

    // Check original doc BEFORE update to guard against duplicate transactions
    const originalOrder = await Order.findOne({ _id: req.params.id, restaurantId });
    if (!originalOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to your restaurant',
      });
    }

    const wasAlreadyPaid = originalOrder.paymentRecorded === true; 


    if (status) {
      updateFields.status = status;
      if (status === 'Preparing') updateFields.prepStartTime = new Date();
      if (status === 'Ready')     updateFields.readyTime     = new Date();
      if (status === 'Completed') {
        updateFields.completedTime = new Date();
        if (originalOrder.prepStartTime) {
          const durationMs = updateFields.completedTime - originalOrder.prepStartTime;
          updateFields.prepDurationSeconds = Math.max(0, Math.round(durationMs / 1000));
        }
      }
    }

    if (isPaid !== undefined) {
      updateFields.isPaid = isPaid;
      if (isPaid) {
        updateFields.paidAt          = new Date();
        updateFields.paymentRecorded = true;
      }
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId },
      updateFields,
      { new: true }
    ).populate('user', 'name phone email segment');
    // INVENTORY DEDUCTION - only on Preparing transition
    if (status === 'Preparing') {
      console.log(`[COGS-TRACE] 1. Status→Preparing triggered for order ${order._id}, items: ${order.items.length}`);
      try {
        const { totalCoGS } = await processOrderInventory(order, req.io);
      } catch (invErr) {
        console.error('Inventory deduction failed (non-blocking):', invErr.message);
      }
    }

    // FINANCE TRANSACTION - only if this is the first time isPaid is set to true
    if (isPaid === true && !wasAlreadyPaid) {   // 👈 duplicate-safe
      try {
        await Transaction.create({
          restaurant:        order.restaurantId,
          user:              order.user._id || order.user,
          order:             order._id,
          type:              'INCOME',
          category:          'SALES',
          amount:            order.totalPrice,
          paymentMethod:     order.paymentMethod === 'Cash' ? 'CASH' : 'CARD',
          description:       `Sales revenue — Order #${order._id}`,
          isSystemGenerated: true,
          status:            'COMPLETED',
          date:              new Date(),
        });
        console.log(`💰 Finance transaction recorded for Order #${order._id}`);
      } catch (finErr) {
        console.error('Finance posting failed (non-blocking):', finErr.message);
      }
    }

    // SOCKET BROADCASTS
    if (req.io) {
      req.io.to(rooms.admin(restaurantId)).emit('order-updated', order);
      req.io.to(rooms.kitchen(restaurantId)).emit('ORDER_STATUS_UPDATED', {
        orderId: order._id,
        status:  order.status,
        isPaid:  order.isPaid,
      });

      if (order.user?.phone) {
        req.io.to(rooms.customer(order.user.phone)).emit('status-update', {
          orderId: order._id,
          status:  order.status,
          isPaid:  order.isPaid,
          message: status === 'Ready' ? 'Your food is ready!' : undefined,
        });
      }
    }

    res.status(200).json({
      success: true,
      order,
      message: `Order marked as ${status || 'updated'}`,
    });

    

  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ success: false, message: 'Status update failed' });
  }
};

/**
 * @desc    Customer requests the bill
 * @route   POST /api/orders/:id/bill
 * @access  Public
 */
exports.requestBill = async (req, res) => {
  try {
    const { billingPreference, email, dateOfBirth } = req.body; 

    const validPreferences = ['Email', 'WhatsApp', 'Printed Bill'];
    const preference = validPreferences.includes(billingPreference)
      ? billingPreference
      : 'Printed Bill';

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        billRequested:     true,
        billRequestedAt:   new Date(),
        billingPreference: preference
      },
      { new: true }
    ).populate('user', 'name phone email dateOfBirth'); 

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Persist email if provided and not already set 
    const customerUpdates = {};

    if (email && !order.user.email) {
      const validator = require('validator');
      if (validator.isEmail(email)) {
        customerUpdates.email = email.trim().toLowerCase();
      }
    }

    // Persist DOB if provided and not already set
    if (dateOfBirth && !order.user.dateOfBirth) {
      const parsed = new Date(dateOfBirth);
      if (!isNaN(parsed) && parsed < new Date()) {
        customerUpdates.dateOfBirth = parsed;
      }
    }

    if (Object.keys(customerUpdates).length > 0) {
      await Customer.findByIdAndUpdate(
        order.user._id,
        customerUpdates,
        { runValidators: true }
      );
      Object.assign(order.user, customerUpdates);
    }

    if (req.io) {
      req.io.to(rooms.kitchen(order.restaurantId)).emit('bill-requested', {
        orderId:           order._id,
        tableId:           order.tableId,
        billingPreference: order.billingPreference,
        status:            order.status
      });
      req.io.to(rooms.admin(order.restaurantId)).emit('billing-preference-updated', {
        orderId:    order._id,
        preference: preference,
        tableId:    order.tableId
      });
    }

    res.status(200).json({ success: true, message: `Bill requested via ${preference}`, order });
  } catch (error) {
    console.error('Request bill error:', error);
    res.status(500).json({ success: false, message: 'Error requesting bill' });
  }
};

/**
 * @desc    Cancel an order
 * @route   PATCH /api/orders/:id/cancel
 * @access  Protected (Admin, Kitchen)
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    const { reason } = req.body;

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId },
      { status: 'Cancelled', cancellationReason: reason },
      { new: true }
    ).populate('user', 'name phone email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to your restaurant'
      });
    }

    if (req.io && order.user?.phone) {
      req.io.to(rooms.customer(order.user.phone)).emit('status-update', {
        orderId: order._id,
        status:  'Cancelled',
      });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Cancellation failed' });
  }
};

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Public
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate({ path: 'items.menuItem', select: 'name price image' });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving order' });
  }
};

/**
 * @desc    Get current and past orders for a customer by phone
 * @route   GET /api/orders/customer/:phone
 * @access  Public
 */
exports.getCustomerOrders = async (req, res) => {
  try {
    const normalizedPhone = req.params.phone.replace(/\D/g, '');
    const customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      return res.status(200).json({ success: true, current: null, past: [] });
    }

    const orders = await Order.find({ user: customer._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name phone email');

    res.status(200).json({
      success: true,
      current: orders.find(o => ['Pending','Preparing','Ready'].includes(o.status)) || null,
      past:    orders.filter(o => ['Completed','Cancelled'].includes(o.status)),
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ success: false, message: 'Error fetching order history' });
  }
};


const analyzeCustomizationRequest = async (menuItemId, restaurantId, ingredientName, action) => {
  const menuItem = await MenuItem.findById(menuItemId)
    .populate('customizationOptions.ingredientEffects.inventoryItem')
    .lean();
  if (!menuItem) return { achievable: false, reason: 'Menu item not found' };

  const lower = ingredientName.toLowerCase();
  const matchedOption = menuItem.customizationOptions?.find(opt =>
    opt.optionName.toLowerCase().includes(lower) || lower.includes(opt.optionName.toLowerCase()) ||
    opt.ingredientEffects?.some(eff => eff.inventoryItem?.name?.toLowerCase().includes(lower))
  );
  if (!matchedOption) return { achievable: false, reason: `${ingredientName} isn't offered on this item` };

  const isReducing = matchedOption.type === 'REMOVE' ||
    ['less', 'no', 'without', 'remove'].some(kw => action.toLowerCase().includes(kw));
  if (isReducing) return { achievable: true };

  const stock = matchedOption.ingredientEffects?.[0]?.inventoryItem;
  if (stock && stock.currentStock <= 0) {
    return { achievable: false, reason: `We're out of ${ingredientName} today` };
  }
  return { achievable: true };
};

/**
 * @desc    AI Customization via Dialogflow
 * @route   POST /api/orders/customize
 * @access  Public
 */
exports.customizeOrderItem = async (req, res) => {
  try {
    const { text, menuItemId, restaurantId } = req.body;
    if (!menuItemId || !restaurantId) {
      return res.status(400).json({ success: false, message: 'menuItemId and restaurantId are required' });
    }

    const aiResult = await analyzeOrderText(text, { restaurantId, menuItemId });
    if (aiResult.intent !== 'order.customize') {
      return res.status(400).json({ success: false, message: 'AI could not parse customization' });
    }

    // Path A: webhook responded with structured data - trust it directly, no re-derivation
    if (aiResult.webhookPayload?.message) {
      const { accepted, rejected, message } = aiResult.webhookPayload;
      return res.status(200).json({
        success: true,
        customizations: (accepted || []).map(a => a.label),
        rejected: (rejected || []).map(r => r.reason),
        message,
      });
    }

    // Path B: webhook didn't fire (timeout/misconfig) - fall back to direct DB validation
    console.warn('Webhook payload missing — falling back to direct validation for order.customize');
    const ingredients = aiResult.parameters.ingredients ?? aiResult.parameters.ingredient ?? [];
    const actions     = aiResult.parameters.actions     ?? aiResult.parameters.action     ?? [];
    const list = Array.isArray(ingredients) ? ingredients : [ingredients].filter(Boolean);
    if (!list.length) {
      return res.status(400).json({ success: false, message: 'No ingredients detected' });
    }

    const analyzed = await Promise.all(
      list.map((ing, i) => analyzeCustomizationRequest(menuItemId, restaurantId, ing,
        (Array.isArray(actions) ? actions[i] : actions) || 'add'))
    );
    const labels = list.map((ing, i) => {
      const action = ((Array.isArray(actions) ? actions[i] : actions) || 'add');
      return `${action.charAt(0).toUpperCase() + action.slice(1)} ${ing}`;
    });
    const rejected = analyzed.map((a, i) => !a.achievable ? a.reason : null).filter(Boolean);
    const accepted = labels.filter((_, i) => analyzed[i].achievable);

    return res.status(200).json({
      success: true,
      customizations: accepted,
      rejected,
      message: rejected.length
        ? (accepted.length ? `I can do ${accepted.join(', ')}, but ${rejected.join('; ')}.` : rejected.join('; '))
        : `Got it! I've updated your order: ${accepted.join(', ')}`,
    });

  } catch (error) {
    console.error('AI Customization Error:', error);
    res.status(500).json({ success: false, message: 'AI Processing Error' });
  }
};

/**
 * @desc    Update specific item status within an order
 * @route   PATCH /api/orders/:id/items/:itemId/status
 * @access  Protected (Kitchen)
 */
exports.updateOrderItemStatus = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    const { id, itemId } = req.params;
    const { isDone } = req.body;

    const order = await Order.findOneAndUpdate(
      { _id: id, restaurantId, 'items._id': itemId },
      { $set: { 'items.$.isDone': isDone } },
      { new: true }
    ).populate('user', 'name phone email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order or item not found or does not belong to your restaurant'
      });
    }

    if (req.io) {
      req.io.to(rooms.kitchen(restaurantId)).emit('order-updated', order);
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Partial update failed' });
  }
};

/**
 * @desc    Update customer email (collected at billing step)
 * @route   PATCH /api/customers/:id/email   — or — PATCH /api/orders/:id/bill
 * @access  Public
 */
exports.updateCustomerEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { email: email.trim().toLowerCase() },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, customer });
  } catch (error) {
    console.error('Update customer email error:', error);
    res.status(500).json({ success: false, message: 'Failed to update email' });
  }
};

/**
 * @desc    Send bill to customer via their preferred channel
 * @route   POST /api/orders/:id/send-bill
 * @access  Protected (Admin, Kitchen)
 */
exports.sendBill = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (String(order.restaurantId) !== String(req.user.restaurantId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const restaurant = await Restaurant.findById(order.restaurantId).lean();
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const preference = order.billingPreference || 'Printed Bill';

    switch (preference) {

      case 'Email': {
        if (!order.user?.email) {
          return res.status(400).json({
            success: false,
            message: 'Customer email not on file.',
          });
        }
        try {
          await sendBillEmail(order, restaurant);
        } catch (emailErr) {
          console.error('Email send failed:', emailErr.message);
          // Return a 500 with the actual config error message
          return res.status(500).json({
            success: false,
            message: `Email failed: ${emailErr.message}`,
          });
        }
        return res.status(200).json({
          success: true,
          channel: 'email',
          message: `Bill emailed to ${order.user.email}`,
        });
      }

      case 'WhatsApp': {
        if (!order.user?.phone) {
          return res.status(400).json({
            success: false,
            message: 'Customer phone not on file.',
          });
        }
        try {
          await sendBillWhatsApp(order, restaurant);
        } catch (waErr) {
          console.error('WhatsApp send failed:', waErr.message);
          return res.status(500).json({
            success: false,
            message: `WhatsApp failed: ${waErr.message}`,
          });
        }
        return res.status(200).json({
          success: true,
          channel: 'whatsapp',
          message: `Bill sent via WhatsApp to ${order.user.phone}`,
        });
      }

      case 'Printed Bill':
      default: {
        const pdfBuffer = await generateBillPDF(order, restaurant);
        return res.status(200).json({
          success:   true,
          channel:   'print',
          message:   'Print data ready',
          pdfBase64: pdfBuffer.toString('base64'),
        });
      }
    }

  } catch (error) {
    console.error('Send bill error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send bill',
    });
  }
};

/**
 * @desc    Get completed/cancelled order archive for KDS
 * @route   GET /api/orders/kds/history
 * @access  Protected (Admin, Kitchen)
 */
exports.getOrderHistory = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    const { page = 1, limit = 50 } = req.query;
    const { station } = req.query;

    const filter = {
      restaurantId,
      status: { $in: ['Completed', 'Cancelled'] },
    };
        if (station && station !== 'All') {
      filter['items.station'] = station;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name phone email segment')
      .sort({ completedTime: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.status(200).json({ success: true, orders, total, page: Number(page) });
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order history' });
  }
};