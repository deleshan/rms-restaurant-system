const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const { convertQuantity } = require('./unitConversion.util');

/**
 * Checks whether a single MenuItem can currently be made (at least 1 serving),
 * based on its BASE (non-optional) recipe ingredients only.
 * Customization-driven ingredients are intentionally excluded — those only
 * apply if the customer picks that option, so they shouldn't block the base item.
 *
 * Returns { isOutOfStock, outOfStockIngredients }
 */
const checkMenuItemStock = async (menuItemId) => {
  const menuItem = await MenuItem.findById(menuItemId)
    .populate('ingredients.inventoryItem')
    .lean();

  if (!menuItem) return null;

  const requiredIngredients = (menuItem.ingredients || []).filter(ing => !ing.isOptional);

  const outOfStockIngredients = [];

  for (const ing of requiredIngredients) {
    const stock = ing.inventoryItem;
    if (!stock) continue; // broken link — skip, don't block the item on a data error

    let neededInStockUnit;
    try {
      neededInStockUnit = convertQuantity(ing.quantityRequired, ing.unit, stock.unit);
    } catch (err) {
      console.warn(`Unit conversion failed while checking stock for "${stock.name}" on "${menuItem.name}": ${err.message}`);
      continue; // don't block on a conversion error either - surfaced via logs instead
    }

    if (stock.currentStock < neededInStockUnit) {
      outOfStockIngredients.push({
        inventoryItem: stock._id,
        name: stock.name,
        required: neededInStockUnit,
        available: stock.currentStock,
        unit: stock.unit,
      });
    }
  }

  return {
    isOutOfStock: outOfStockIngredients.length > 0,
    outOfStockIngredients,
  };
};

/**
 * Recomputes and persists isOutOfStock for a single MenuItem.
 */
const recalculateMenuItemAvailability = async (menuItemId) => {
  const result = await checkMenuItemStock(menuItemId);
  if (!result) return null;

  const updated = await MenuItem.findByIdAndUpdate(
    menuItemId,
    {
      $set: {
        isOutOfStock: result.isOutOfStock,
        outOfStockIngredients: result.outOfStockIngredients,
      },
    },
    { new: true }
  );

  return updated;
};

/**
 * Recomputes availability for every MenuItem that uses a given inventory item —
 * call this whenever that inventory item's currentStock changes (order deduction,
 * purchase/restock, manual stock edit).
 */
const recalculateAvailabilityForInventoryItem = async (inventoryItemId, restaurantId, io = null) => {
  const affectedItems = await MenuItem.find({
    restaurantId,
    'ingredients.inventoryItem': inventoryItemId,
  }).select('_id');

  const results = [];
  for (const { _id } of affectedItems) {
    const updated = await recalculateMenuItemAvailability(_id);
    if (updated) results.push(updated);
  }

  if (io && results.length > 0) {
    io.to(`admin_${restaurantId}`).emit('menu-availability-updated', {
      items: results.map(r => ({
        _id: r._id,
        name: r.name,
        isOutOfStock: r.isOutOfStock,
        outOfStockIngredients: r.outOfStockIngredients,
      })),
    });
  }

  return results;
};

module.exports = {
  checkMenuItemStock,
  recalculateMenuItemAvailability,
  recalculateAvailabilityForInventoryItem,
};