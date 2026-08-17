const express = require('express');
const router = express.Router();

const { 
    getCustomers, 
    toggleCustomerStatus, 
    getCustomerSegments,
    globalSearch,
    getCustomerById, 
} = require('../controllers/adminController');

const { getDashboardStats} = require('../controllers/dashboardController');


const { protect, admin } = require('../middleware/auth');

//CUSTOMER MANAGEMENT ROUTES
 
// @route   GET /api/admin/customers
router.get('/customers', protect, admin, getCustomers);

router.get('/customers/:id', protect, admin, getCustomerById);

// @route   PATCH /api/admin/customers/:id/status
router.patch('/customers/:id/status', protect, admin, toggleCustomerStatus);


// @route   GET /api/admin/dashboard-stats
// @desc    Get aggregated business metrics (Revenue, Order counts, Segment distribution)
router.get('/dashboard-stats', protect, admin, getDashboardStats);

router.get('/search', protect, admin, globalSearch);

// @route   POST /api/admin/trigger-segmentation
// @desc    Manually trigger the Scikit-learn K-Means clustering via the Python bridge
router.post('/trigger-segmentation', protect, admin, getCustomerSegments);


module.exports = router;