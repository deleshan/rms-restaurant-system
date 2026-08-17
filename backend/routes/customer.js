const express = require('express');
const router = express.Router();
const {
  registerCustomer,
  getCustomerByPhone,
  updateCustomer,
} = require('../controllers/customerController');

// POST /api/customers - Register/identify
router.post('/', registerCustomer);

// GET /api/customers/:phone - Get customer
router.get('/:phone', getCustomerByPhone);

// PUT /api/customers/:phone - Update customer
router.put('/:phone', updateCustomer);

module.exports = router;