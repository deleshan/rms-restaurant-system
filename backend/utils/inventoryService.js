const Inventory    = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const Transaction  = require('../models/Transaction');
const MenuItem     = require('../models/MenuItem');

/**
 * Resolves the final ingredient list for an order item
 * after applying all customer customizations
 */
const resolveIngredients = async (menuItemId, customizations = []) => {
  const menuItem = await MenuItem.findById(menuItemId)
    .populate('ingredients.inventoryItem')
    .populate('customizationOptions.ingredientEffects.inventoryItem')
    .lean();

  if (!menuItem) throw new Error(`MenuItem ${menuItemId} not found`);

  // Deep clone base ingredients
  const resolved = menuItem.ingredients.map(ing => ({
    inventoryItemId: ing.inventoryItem._id,
    inventoryItem:   ing.inventoryItem,
    quantity:        ing.quantityRequired,
    unit:            ing.unit,
    source:          'BASE'
  }));

  // Apply each customization's ingredient effects
  for (const customText of customizations) {
    const matchedOption = menuItem.customizationOptions.find(opt =>
      opt.optionName.toLowerCase() === customText.toLowerCase() ||
      customText.toLowerCase().includes(opt.optionName.toLowerCase())
    );

    if (!matchedOption || !matchedOption.ingredientEffects?.length) continue;

    for (const effect of matchedOption.ingredientEffects) {
      const existingIndex = resolved.findIndex(
        r => r.inventoryItemId.toString() === effect.inventoryItem._id.toString()
      );

      if (matchedOption.type === 'REMOVE') {
        if (existingIndex !== -1) resolved.splice(existingIndex, 1);

      } else if (matchedOption.type === 'ADD') {
        if (existingIndex !== -1) {
          resolved[existingIndex].quantity += effect.quantityDelta;
        } else {
          resolved.push({
            inventoryItemId: effect.inventoryItem._id,
            inventoryItem:   effect.inventoryItem,
            quantity:        effect.quantityDelta,
            unit:            effect.unit,
            source:          'CUSTOMIZATION'
          });
        }

      } else if (matchedOption.type === 'SWAP') {
        if (existingIndex !== -1) {
          resolved[existingIndex] = {
            inventoryItemId: effect.inventoryItem._id,
            inventoryItem:   effect.inventoryItem,
            quantity:        effect.quantityDelta,
            unit:            effect.unit,
            source:          'CUSTOMIZATION'
          };
        }
      }
    }
  }

  // Filter out zero/negative quantity ingredients
  return resolved.filter(r => r.quantity > 0);
};

/**
 * Deducts inventory for a single order item.
 * Uses FIFO batch deduction.
 * Returns the total CoGS for this item.
 */
const deductInventoryForOrderItem = async (
  orderItem,
  restaurantId,
  orderId,
  session  // Mongoose session for atomicity
) => {
  const ingredients = await resolveIngredients(
    orderItem.menuItem,
    orderItem.customizations || []
  );

  let totalCoGS = 0;
  const movements = [];

  for (const ing of ingredients) {
    const totalNeeded = ing.quantity * orderItem.qty;

    const stock = await Inventory.findOne({
      _id: ing.inventoryItemId,
      restaurantId
    }).session(session);

    if (!stock) {
      console.warn(`⚠️ Inventory item ${ing.inventoryItemId} not found for restaurant ${restaurantId}`);
      continue;
    }

    const quantityBefore = stock.currentStock;

    // --- FIFO Batch Deduction ---
    let remaining = totalNeeded;
    const updatedBatches = [];

    for (const batch of stock.batches) {
      if (remaining <= 0) break;
      if (batch.quantity <= 0) continue;

      // Skip expired batches
      if (batch.expiryDate && batch.expiryDate < new Date()) continue;

      if (batch.quantity >= remaining) {
        batch.quantity -= remaining;
        remaining = 0;
      } else {
        remaining -= batch.quantity;
        batch.quantity = 0;
      }
      updatedBatches.push(batch);
    }

    stock.batches = updatedBatches;
    // pre('save') hook recalculates currentStock from batches
    await stock.save({ session });

    // Cost snapshot at time of transaction
    const costAtTime = stock.costPerUnit || ing.inventoryItem.costPerUnit || 0;
    const costImpact = totalNeeded * costAtTime;
    totalCoGS += costImpact;

    // Log the movement
    movements.push({
      restaurantId,
      inventoryItem:     ing.inventoryItemId,
      type:              'SALE',
      quantityChange:    -totalNeeded,
      quantityBefore,
      quantityAfter:     stock.currentStock,
      costPerUnitAtTime: costAtTime,
      totalCostImpact:   costImpact,
      referenceType:     'ORDER',
      referenceId:       orderId,
      menuItemId:        orderItem.menuItem,
      isSystemGenerated: true
    });

    // Trigger low stock alert
    if (stock.currentStock <= stock.minimumStock) {
      emitLowStockAlert(stock, restaurantId);
    }
  }

  // Bulk insert all movements
  if (movements.length > 0) {
    await StockMovement.insertMany(movements, { session });
  }

  return totalCoGS;
};

/**
 * Processes entire order: deducts inventory + calculates CoGS
 * Call this when order status changes to 'Preparing'
 */
const processOrderInventory = async (order, io = null) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();

  try {
    let orderTotalCoGS = 0;

    for (const item of order.items) {
      if (!item.menuItem) continue;
      const itemCoGS = await deductInventoryForOrderItem(
        item,
        order.restaurantId,
        order._id,
        session
      );
      orderTotalCoGS += itemCoGS;
    }

    // Post CoGS to Finance Ledger
    await postCoGSToFinance(order, orderTotalCoGS, session);

    await session.commitTransaction();

    console.log(`Inventory processed for order ${order._id} | CoGS: ${orderTotalCoGS}`);
    return { success: true, totalCoGS: orderTotalCoGS };

  } catch (err) {
    await session.abortTransaction();
    console.error(`Inventory processing failed for order ${order._id}:`, err);
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Posts CoGS and Sales Revenue double-entry to Transaction model
 */
const postCoGSToFinance = async (order, totalCoGS, session) => {
  if (totalCoGS <= 0) return;

  await Transaction.create([{
    restaurant:          order.restaurantId,
    user:                order.user,
    order:               order._id,
    type:                'EXPENSE',
    category:            'COGS',          
    amount:              totalCoGS,
    paymentMethod:       'CASH',          
    description:         `COGS — Order #${order._id}`,
    isSystemGenerated:   true,
    status:              'COMPLETED',
    date:                new Date(),
    details: { inventoryValue: totalCoGS }
  }], { session });
};

/**
 * Emits low stock alert via socket or logs it
 */
const emitLowStockAlert = (stock, restaurantId, io = null) => {
  const alert = {
    type:          stock.currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
    inventoryId:   stock._id,
    itemName:      stock.name,
    currentStock:  stock.currentStock,
    minimumStock:  stock.minimumStock,
    restaurantId,
    timestamp:     new Date()
  };

  // If io is passed from controller, emit real-time
  if (io) {
    io.to(`admin_${restaurantId}`).emit('inventory-alert', alert);
    io.to(`kitchen_${restaurantId}`).emit('inventory-alert', alert);
  }

  console.warn(`${alert.type}: ${stock.name} | Stock: ${stock.currentStock}/${stock.minimumStock}`);
};

module.exports = {
  resolveIngredients,
  deductInventoryForOrderItem,
  processOrderInventory,
  postCoGSToFinance,
  emitLowStockAlert
};