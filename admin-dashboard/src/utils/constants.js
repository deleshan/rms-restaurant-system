export const APP_NAME = 'RMS Admin';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Restaurant Management System - Admin Dashboard';
export const COMPANY_NAME = 'Spice Hub Restaurant';

// API & Environment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const IS_PRODUCTION = import.meta.env.MODE === 'production';
export const DEFAULT_TIMEOUT = 30000; 

// Authentication
export const AUTH_TOKEN_KEY = 'token';
export const USER_KEY = 'user';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

// Date & Time Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy hh:mm a';
export const TIME_FORMAT = 'hh:mm a';
export const API_DATE_FORMAT = 'YYYY-MM-DD';
export const DEFAULT_TIMEZONE = 'Asia/Colombo';

// Currency & Numbers
export const DEFAULT_CURRENCY = 'LKR';
export const CURRENCY_SYMBOL = 'Rs. ';
export const CURRENCY_SYMBOL_POSITION = 'prefix'; // 'prefix' | 'suffix'
export const NUMBER_LOCALE = 'si-LK'; // Sri Lanka locale

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

// Status / State constants
export const ORDER_STATUSES = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUSES.PENDING]: 'warning',
  [ORDER_STATUSES.PREPARING]: 'info',
  [ORDER_STATUSES.READY]: 'success',
  [ORDER_STATUSES.COMPLETED]: 'success',
  [ORDER_STATUSES.CANCELLED]: 'danger',
};

export const REVIEW_STATUSES = {
  PENDING: 'Pending',
  REPLIED: 'Replied',
  FLAGGED: 'Flagged',
};

export const PROMOTION_STATUSES = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  EXPIRED: 'Expired',
};

// Role / Permission constants
export const USER_ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  GUEST: 'guest',
};

export const PERMISSIONS = {
  VIEW_ORDERS: 'view:orders',
  MANAGE_ORDERS: 'manage:orders',
  VIEW_MENU: 'view:menu',
  MANAGE_MENU: 'manage:menu',
  VIEW_CUSTOMERS: 'view:customers',
  MANAGE_CUSTOMERS: 'manage:customers',
  MANAGE_PROMOTIONS: 'manage:promotions',
  VIEW_REVIEWS: 'view:reviews',
  MANAGE_REVIEWS: 'manage:reviews',
  VIEW_FINANCE: 'view:finance',
  MANAGE_FINANCE: 'manage:finance',
  MANAGE_SETTINGS: 'manage:settings',
  MANAGE_INVENTORY: 'manage:inventory',
};

// UI & Theme
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const BREAKPOINTS = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Toast / Notification durations (ms)
export const TOAST_DURATION = {
  SHORT: 3000,
  DEFAULT: 5000,
  LONG: 8000,
};

// Local Storage / Session keys
export const STORAGE_KEYS = {
  THEME: 'theme_preference',
  LAST_VISITED_PAGE: 'last_visited_page',
  COLLAPSED_SIDEBAR: 'sidebar_collapsed',
};


export default {
  APP_NAME,
  APP_VERSION,
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  USER_KEY,
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  DEFAULT_CURRENCY,
  CURRENCY_SYMBOL,
  ORDER_STATUSES,
  ORDER_STATUS_COLORS,
  REVIEW_STATUSES,
  PROMOTION_STATUSES,
  USER_ROLES,
  PERMISSIONS,
  THEME,
  BREAKPOINTS,
  TOAST_DURATION,
  STORAGE_KEYS,
};