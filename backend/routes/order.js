const express = require('express');
const router = express.Router();
const {
  createOrder,
  getCustomerOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  requestBill,
  customizeOrderItem,
  getKDSActiveOrders, 
  updateOrderItemStatus,
  sendBill,
  getOrderHistory,
} = require('../controllers/orderController');


const { protect, restrictTo } = require('../middleware/auth');

//Public Routes (Customer App)

// Create a new order
router.post('/', createOrder);

// AI Customization (Dialogflow) - usually called during order building
router.post('/customize', customizeOrderItem);

// Get order history by phone number
router.get('/customer/:phone', getCustomerOrders);

// Get a single order's details
// Note: Leave this public or handle auth carefully so customers can see their status
router.get('/:id', getOrderById); 

// Request the bill
router.put('/:id/request-bill', requestBill);


// Protected Routes (Admin/Kitchen Dashboard)

// All routes below this line require a valid login (Admin or Kitchen Staff)
router.use(protect);
router.use(restrictTo('admin', 'kitchen'));

// Get all orders with stats
router.get('/', getAllOrders);

// Update status (Preparing, Ready, etc.)
// Switched to PATCH to match Frontend Thunks
router.patch('/:id/status', updateOrderStatus);

// Cancel order with reason
router.patch('/:id/cancel', cancelOrder);


router.get('/kds/active', getKDSActiveOrders);
router.get('/kds/history', getOrderHistory);
router.patch('/:id/items/:itemId/status', updateOrderItemStatus);

router.post('/:id/send-bill', sendBill);



module.exports = router;