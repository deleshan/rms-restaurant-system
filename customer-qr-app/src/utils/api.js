import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
// Attaches token for Admin/Kitchen protected routes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor 
// Returns response.data directly so thunks get clean data
// Extracts error message string so thunks can call rejectWithValue(error)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'An unexpected error occurred';

    if (error.response) {
      // Backend returned an error response (400, 404, 500)
      message =
        error.response.data?.message ||
        error.response.data?.error ||
        `Server error: ${error.response.status}`;
    } else if (error.request) {
      // Request made but no response (server down / network issue)
      message = 'No response from server. Please check your connection.';
    } else {
      // Axios config error or something else
      message = error.message;
    }

    return Promise.reject(message);
  }
);

// API Service 
export const apiService = {

  // Auth & Customer 

  /**
   * Register a new customer (called on first QR scan)
   */
  registerCustomer: (customerData) =>
    api.post('/customers', customerData),

  /**
   * Fetch existing customer by phone number
   * Used for returning customer login
   */
  getCustomerByPhone: (phone, restaurantId) =>
    api.get(`/customers/${phone}`, { params: { restaurantId } }),

  /**
   * Update customer profile details
   */
  updateCustomer: (phone, customerData) =>
    api.put(`/customers/${phone}`, customerData),

  // Menu 

  /**
   * Fetch the full menu for a restaurant
   */
  getMenu: (restaurantId) =>
    api.get('/menu/items', { params: { restaurantId } }),

  // Orders

  /**
   * Place a new order (called from CartPage)
   * POST /api/orders
   */
  placeOrder: (orderData) =>
    api.post('/orders', orderData),

  /**
   * Get a single order by its MongoDB ID
   * Used when customer refreshes the status page
   * GET /api/orders/:id
   */
  getOrderById: (orderId) =>
    api.get(`/orders/${orderId}`),

  /**
   * Get current + past orders for a customer by phone
   * Returns: { success, current: {} | null, past: [] }
   * GET /api/orders/customer/:phone
   */
  getCustomerOrders: (phone, restaurantId) =>
    api.get(`/orders/customer/${phone}`, { params: { restaurantId } }),

  /**
   * Request the bill for an order
   * POST /api/orders/:id/bill
   */
  requestBill: (orderId, billData) =>
    api.post(`/orders/${orderId}/bill`, billData),

  // Admin / Kitchen (Protected) 

  /**
   * Get all orders with stats (Admin/Kitchen dashboard)
   * GET /api/orders
   */
  getAllOrders: (status) =>
    api.get('/orders', { params: status ? { status } : {} }),

  /**
   * Update order status (Preparing, Ready, Completed, etc.)
   * FIX: Changed from PUT to PATCH to match your backend route
   * PATCH /api/orders/:id/status
   */
  updateOrderStatus: (orderId, status) =>
    api.patch(`/orders/${orderId}/status`, { status }),

  /**
   * Cancel an order with a reason
   * PATCH /api/orders/:id/cancel
   */
  cancelOrder: (orderId, reason) =>
    api.patch(`/orders/${orderId}/cancel`, { reason }),

  // Reviews 

  /**
   * Submit a customer review after order completion
   * POST /api/reviews
   */
  submitReview: (reviewData) =>
    api.post('/reviews', reviewData),

  // AI Customization

  /**
   * Send natural language text to Dialogflow via backend
   * POST /api/orders/customize
   */
  customizeOrder: (text, menuItemId, restaurantId) =>
  api.post('/orders/customize', { text, menuItemId, restaurantId }),

  // Finance (Admin) 

  /**
   * Get financial reports
   * GET /api/finance/report
   */
  getFinanceReport: (params) =>
    api.get('/finance/report', { params }),

  // Promotions (Admin) 

  /**
   * Get all promotions / segments
   * GET /api/promotions
   */
  getPromotions: () =>
    api.get('/promotions'),

  /**
   * Create and send a new marketing campaign
   * POST /api/promotions/campaign
   */
  sendCampaign: (campaignData) =>
    api.post('/promotions/campaign', campaignData),

  // Settings (Admin)

  /**
   * Get restaurant settings
   * GET /api/settings
   */
  getSettings: () =>
    api.get('/settings'),

  /**
   * Update restaurant settings
   * PUT /api/settings
   */
  updateSettings: (settingsData) =>
    api.put('/settings', settingsData),

  // Orders 

  /**
   * New: Update bill request with specific preference (Email/SMS/Print)
   * PUT /api/orders/:id/request-bill
   */
  updateBillRequest: (orderId, billingData) =>
    api.put(`/orders/${orderId}/request-bill`, billingData),

  /**
   * Request the bill for an order (Initial request)
   * POST /api/orders/:id/bill
   */
  requestBill: (orderId, billData) =>
    api.post(`/orders/${orderId}/bill`, billData),
};

export { api };

export default apiService;