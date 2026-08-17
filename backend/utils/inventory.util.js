const Inventory      = require('../models/Inventory');
const StockMovement  = require('../models/StockMovement');
const Transaction    = require('../models/Transaction');
const MenuItem       = require('../models/MenuItem');
const { convertQuantity } = require('./unitConversion.util');
const { recalculateAvailabilityForInventoryItem } = require('./menuAvailability.util');


const resolveIngredients = async (menuItemId, customizations = []) => {
  const menuItem = await MenuItem.findById(menuItemId)
    .populate('ingredients.inventoryItem')
    .populate('customizationOptions.ingredientEffects.inventoryItem')
    .lean();

  if (!menuItem) throw new Error(`MenuItem ${menuItemId} not found`);

  const resolved = menuItem.ingredients
    .filter(ing => {
      if (!ing.inventoryItem) {
        console.warn(`MenuItem "${menuItem.name}" has a recipe ingredient with no valid Inventory link — skipping (menuItemId: ${menuItemId})`);
        return false;
      }
      return true;
    })
    .map(ing => ({
      inventoryItemId: ing.inventoryItem._id,
      inventoryItem:   ing.inventoryItem,
      quantity:        ing.quantityRequired,
      unit:            ing.unit,
      source:          'BASE'
    }));

  for (const customText of customizations) {
    const matchedOption = menuItem.customizationOptions.find(opt =>
      opt.optionName.toLowerCase() === customText.toLowerCase() ||
      customText.toLowerCase().includes(opt.optionName.toLowerCase())
    );

    if (!matchedOption || !matchedOption.ingredientEffects?.length) continue;

    for (const effect of matchedOption.ingredientEffects) {
      if (!effect.inventoryItem) {
        console.warn(`Customization "${matchedOption.optionName}" on "${menuItem.name}" has a broken ingredient link — skipping`);
        continue;
      }
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

  return resolved.filter(r => r.quantity > 0);
};

/**
 * Custom error used when an order needs more stock than exists.
 * Kept distinct from generic Error so callers/logs can identify it easily.
 */
class InsufficientStockError extends Error {
  constructor(itemName, needed, available, unit) {
    super(`Insufficient stock for "${itemName}": need ${needed}${unit}, only ${available}${unit} available`);
    this.name = 'InsufficientStockError';
    this.itemName = itemName;
  }
}

const deductInventoryForOrderItem = async (orderItem, restaurantId, orderId, session, io = null) => {
  const ingredients = await resolveIngredients(orderItem.menuItem, orderItem.customizations || []);

  let totalCoGS = 0;
  const movements = [];
  const touchedIds = [];

  for (const ing of ingredients) {
    const stock = await Inventory.findOne({ _id: ing.inventoryItemId, restaurantId }).session(session);
    if (!stock) {
      continue;
    }
  
    // UNIT CONVERSION 
    // Recipe quantities (ing.unit, e.g. "g"/"ml") must be converted into the
    // SAME unit the inventory item is stocked/priced in (stock.unit, e.g. "kg")
    // before they're used for stock deduction OR cost calculation.
    // Mixing units here (e.g. multiplying grams by a per-kg cost) is what
    // caused COGS to be ~1000x too high.
    const rawQtyNeeded = ing.quantity * orderItem.qty; // in recipe's unit (ing.unit)

    let totalNeeded; 
    try {
      totalNeeded = convertQuantity(rawQtyNeeded, ing.unit, stock.unit);
    } catch (conversionErr) {
      console.error(
        `Unit conversion failed for "${stock.name}" (menuItem ingredient unit "${ing.unit}" ` +
        `vs inventory unit "${stock.unit}"): ${conversionErr.message}`
      );
      throw conversionErr;
    }

    const quantityBefore = stock.currentStock;
    let costAtTime;
    let costImpact;

    if (stock.batches && stock.batches.length > 0) {
      let remaining = totalNeeded;
      const updatedBatches = [];
      let weightedCostTotal = 0;
      let quantityConsumedFromBatches = 0;

      for (const batch of stock.batches) {
        if (remaining <= 0) { updatedBatches.push(batch); continue; }
        if (batch.quantity <= 0) continue;
        if (batch.expiryDate && batch.expiryDate < new Date()) { updatedBatches.push(batch); continue; }

        const consumeFromThisBatch = Math.min(batch.quantity, remaining);
        weightedCostTotal += consumeFromThisBatch * (batch.costPerBatchUnit || stock.costPerUnit || 0);
        quantityConsumedFromBatches += consumeFromThisBatch;

        batch.quantity -= consumeFromThisBatch;
        remaining -= consumeFromThisBatch;
        updatedBatches.push(batch);
      }

      if (remaining > 0.0001) {
        throw new InsufficientStockError(stock.name, totalNeeded, quantityBefore, stock.unit);
      }

      stock.batches = updatedBatches;
      await stock.save({ session });

      costAtTime = quantityConsumedFromBatches > 0
        ? weightedCostTotal / quantityConsumedFromBatches
        : (stock.costPerUnit || ing.inventoryItem.costPerUnit || 0);
      costImpact = totalNeeded * costAtTime;

    } else {
      if (totalNeeded > stock.currentStock + 0.0001) {
        throw new InsufficientStockError(stock.name, totalNeeded, stock.currentStock, stock.unit);
      }

      stock.currentStock = Math.max(0, stock.currentStock - totalNeeded);
      await stock.save({ session });

      costAtTime = stock.costPerUnit || ing.inventoryItem.costPerUnit || 0;
      costImpact = totalNeeded * costAtTime;
    }
    totalCoGS += costImpact;
    touchedIds.push(ing.inventoryItemId);
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

    if (stock.currentStock <= stock.minimumStock) {
      emitLowStockAlert(stock, restaurantId, io);
    }
  }

  if (movements.length > 0) {
    await StockMovement.insertMany(movements, { session });
  }
  return { totalCoGS, touchedIds };
};

const processOrderInventory = async (order, io = null) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();

  const touchedInventoryIds = new Set();

  try {
    let orderTotalCoGS = 0;

    for (const item of order.items) {
      if (!item.menuItem) {
        continue;
      }

      const { totalCoGS: itemCoGS, touchedIds } = await deductInventoryForOrderItem(item, order.restaurantId, order._id, session, io);
      orderTotalCoGS += itemCoGS;
      touchedIds.forEach(id => touchedInventoryIds.add(String(id)));
    }
    await postCoGSToFinance(order, orderTotalCoGS, session);
    await session.commitTransaction();

    for (const invId of touchedInventoryIds) {
      await recalculateAvailabilityForInventoryItem(invId, order.restaurantId, io);
    }

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

const postCoGSToFinance = async (order, totalCoGS, session) => {
  
   const created = await Transaction.create([{
    restaurant: order.restaurantId,
    user: order.user,
    order: order._id,
    type: 'EXPENSE',
    category: 'COGS',
    amount: totalCoGS,
    paymentMethod: 'CASH',
    description: `COGS — Order #${order._id}`,
    isSystemGenerated: true,
    status: 'COMPLETED',
    date: new Date(),
    details: { inventoryValue: totalCoGS }
  }], { session });
};

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
  emitLowStockAlert,
  InsufficientStockError
};