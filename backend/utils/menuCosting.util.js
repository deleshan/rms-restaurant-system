const { resolveIngredients } = require('./inventory.util');
const { convertQuantity } = require('./unitConversion.util');

/**
 * Computes the current ingredient cost for one unit (qty=1) of a menu item,
 * using the same weighted-batch-cost logic as order-time COGS, but WITHOUT
 * mutating any Inventory documents. Read-only preview.
 */
const calculateMenuItemCost = async (menuItemId) => {
  const ingredients = await resolveIngredients(menuItemId, []);
  const breakdown = [];
  let totalCost = 0;
  let hasMissingCostData = false;

  for (const ing of ingredients) {
    const stock = ing.inventoryItem; 

    if (!stock) {
      breakdown.push({
        ingredientName: 'Unknown (broken link)',
        quantityRequired: ing.quantity,
        unit: ing.unit,
        costPerUnit: 0,
        lineCost: 0,
        warning: 'Inventory link missing',
      });
      hasMissingCostData = true;
      continue;
    }

    let convertedQty;
    let conversionWarning = null;
    try {
      convertedQty = convertQuantity(ing.quantity, ing.unit, stock.unit);
    } catch (err) {
      convertedQty = ing.quantity;
      conversionWarning = err.message;
      hasMissingCostData = true;
    }

    // Weighted-average cost across current batches (mirrors FIFO costing logic,
    // but non-destructive: we just read batch.quantity, we never subtract from it)
    let costPerUnit = stock.costPerUnit || 0;
    if (stock.batches && stock.batches.length > 0) {
      const validBatches = stock.batches.filter(b => b.quantity > 0);
      const totalBatchQty = validBatches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalBatchQty > 0) {
        const weightedTotal = validBatches.reduce(
          (sum, b) => sum + b.quantity * (b.costPerBatchUnit || stock.costPerUnit || 0), 0
        );
        costPerUnit = weightedTotal / totalBatchQty;
      }
    }

    const lineCost = convertedQty * costPerUnit;
    totalCost += lineCost;

    breakdown.push({
      ingredientName: stock.name,
      quantityRequired: ing.quantity,
      unit: ing.unit,
      convertedQty,
      inventoryUnit: stock.unit,
      costPerUnit,
      lineCost: +lineCost.toFixed(2),
      warning: conversionWarning,
    });
  }

  return {
    totalCost: +totalCost.toFixed(2),
    breakdown,
    hasMissingCostData, 
    ingredientCount: ingredients.length,
  };
};

/**
 * Given a cost and a target profit margin %, calculates the suggested selling price.
 * Uses margin-on-price convention (not markup-on-cost) since that's the standard
 * restaurant industry definition: margin% = (price - cost) / price.
 */
const calculatePriceFromMargin = (cost, marginPercent) => {
  const margin = Number(marginPercent);
  if (margin >= 100 || margin < 0) {
    throw new Error('Margin must be between 0 and 99.99%');
  }
  const exactPrice = cost / (1 - margin / 100);
  return {
    exact: +exactPrice.toFixed(2),
    rounded: Math.round(exactPrice/10)*10, 
  };
};

module.exports = { calculateMenuItemCost, calculatePriceFromMargin };