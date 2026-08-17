// Order Statuses
export const ORDER_STATUS = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Kitchen Stations
export const STATIONS = {
  ALL: 'Full Kitchen',
  GRILL: 'Grill',
  SALAD: 'Salad',
  FRY: 'Fry',
  DESSERT: 'Dessert',
};

// Timing Thresholds (in minutes)
export const TIMING = {
  WARNING_THRESHOLD: 10, // Yellow glow
  URGENT_THRESHOLD: 15,  // Red pulsing
  AUTO_HIDE_READY: 5,    // Auto-remove 'Ready' orders after 5 mins
};

// API Endpoints
export const ENDPOINTS = {
  AUTH: '/auth/login',
  ORDERS: '/orders',
  INVENTORY: '/inventory',
};