const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365.25;

/**
 * Normalize a date to the start of the day (00:00:00.000)
 */
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Normalize a date to the end of the day (23:59:59.999)
 */
const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Calculate depreciation for a single asset between two dates.
 * Returns the exact depreciation amount (not rounded).
 */
const calculateAssetDepreciation = (asset, fromDate, toDate) => {
  // Land never depreciates
  if (asset.assetType === 'Land') return 0;

  // If sold/disposed, depreciation stops at sale date
  const assetEndDate = (asset.status === 'Sold' || asset.status === 'Disposed') 
    ? (asset.saleDate || toDate) 
    : toDate;

  // Use start of day for consistency
  const start = startOfDay(Math.max(fromDate.getTime(), asset.purchaseDate.getTime()));
  const end = startOfDay(Math.min(toDate.getTime(), assetEndDate.getTime()));

  if (start >= end) return 0;

  const daysHeld = (end.getTime() - start.getTime()) / MS_PER_DAY;
  const life = asset.usefulLife || 5;
  const salvage = asset.salvageValue || 0;
  const depreciableBase = asset.purchaseCost - salvage;

  let annualDepreciation;

  if (asset.depreciationMethod === 'declining-balance') {
    // Declining balance: calculate based on book value at period START
    const yearsBeforePeriod = (start.getTime() - asset.purchaseDate.getTime()) / (MS_PER_DAY * DAYS_PER_YEAR);
    const beginningBookValue = Math.max(
      asset.purchaseCost * Math.pow(1 - (2 / life), yearsBeforePeriod),
      salvage
    );
    annualDepreciation = beginningBookValue * (2 / life);
  } else {
    // Straight-line
    annualDepreciation = depreciableBase / life;
  }

  const periodDepreciation = (annualDepreciation / DAYS_PER_YEAR) * daysHeld;

  // Cap at depreciable base (can't depreciate more than cost - salvage)
  return Math.min(periodDepreciation, depreciableBase);
};

/**
 * Calculate total depreciation for multiple assets between two dates.
 */
const calculateTotalDepreciation = (assets, fromDate, toDate) => {
  return assets.reduce((sum, asset) => {
    return sum + calculateAssetDepreciation(asset, fromDate, toDate);
  }, 0);
};

/**
 * Calculate book value as of a specific date (defaults to end of today).
 */
const calculateBookValue = (asset, asOfDate = endOfDay(new Date())) => {
  if (asset.assetType === 'Land') return asset.purchaseCost;
  
  const totalDepreciation = calculateAssetDepreciation(asset, asset.purchaseDate, asOfDate);
  return Math.max(asset.purchaseCost - totalDepreciation, 0);
};

module.exports = {
  startOfDay,
  endOfDay,
  calculateAssetDepreciation,
  calculateTotalDepreciation,
  calculateBookValue,
  DAYS_PER_YEAR,
  MS_PER_DAY,
};