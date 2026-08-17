/**
 * Utility functions for currency formatting
 * Designed for Sri Lankan Rupee (LKR) but flexible for other currencies
 */

/**
 * Main currency formatter
 * @param {number|string} amount - The value to format
 * @param {Object} [options] - Formatting options
 * @param {string} [options.currency='LKR'] - ISO currency code
 * @param {string} [options.symbol='Rs. '] - Currency symbol (prefix)
 * @param {boolean} [options.withSymbol=true] - Show symbol
 * @param {number} [options.decimals=2] - Number of decimal places
 * @param {string} [options.locale='si-LK'] - Intl locale
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = 'LKR',
    symbol = 'Rs. ',
    withSymbol = true,
    decimals = 2,
    locale = 'si-LK',
  } = options;

  // Handle invalid/empty input
  if (amount == null || amount === '' || isNaN(amount)) {
    return withSymbol ? `${symbol}0.00` : '0.00';
  }

  const num = Number(amount);

  // Format number part
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const formattedNumber = formatter.format(Math.abs(num));

  const sign = num < 0 ? '-' : '';
  const result = `${sign}${formattedNumber}`;

  return withSymbol ? `${symbol}${result}` : result;
};

/**
 * Shorthand for Sri Lankan Rupee (most common in your project)
 * @param {number|string} amount
 * @param {boolean} [withSymbol=true]
 * @returns {string}
 */
export const formatLKR = (amount, withSymbol = true) => {
  return formatCurrency(amount, {
    currency: 'LKR',
    symbol: 'Rs. ',
    withSymbol,
    decimals: 2,
    locale: 'si-LK',
  });
};

/**
 * Format currency with compact notation (K, M, B)
 * Useful for large numbers in dashboards
 * @param {number} amount
 * @param {Object} [options]
 * @returns {string}
 */
export const formatCompactCurrency = (amount, options = {}) => {
  if (Math.abs(amount) < 1000) {
    return formatCurrency(amount, options);
  }

  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(Math.abs(amount)) / 3);

  if (tier === 0) return formatCurrency(amount, options);

  const scaled = amount / Math.pow(10, tier * 3);
  const formatted = scaled.toFixed(1).replace(/\.0$/, '');

  return formatCurrency(formatted, {
    ...options,
    withSymbol: false,
  }) + suffixes[tier];
};

/**
 * Format money with color indication (red for negative)
 * Useful for profit/loss, discounts, etc.
 * @param {number} amount
 * @param {Object} [options]
 * @returns {{value: string, colorClass: string}}
 */
export const formatMoneyWithColor = (amount, options = {}) => {
  const formatted = formatCurrency(Math.abs(amount), options);
  const isNegative = amount < 0;

  return {
    value: isNegative ? `-${formatted}` : formatted,
    colorClass: isNegative ? 'text-red-600' : 'text-emerald-600',
  };
};

/**
 * Format discount / savings
 * @param {number} original - Original price
 * @param {number} discounted - Discounted price
 * @returns {{savings: string, percentage: string}}
 */
export const formatDiscount = (original, discounted) => {
  if (!original || !discounted || original <= discounted) {
    return { savings: '0.00', percentage: '0%' };
  }

  const savings = original - discounted;
  const percentage = ((savings / original) * 100).toFixed(0);

  return {
    savings: formatLKR(savings),
    percentage: `${percentage}%`,
  };
};


export default {
  formatCurrency,
  formatLKR,
  formatCompactCurrency,
  formatMoneyWithColor,
  formatDiscount,
};