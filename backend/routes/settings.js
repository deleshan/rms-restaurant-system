const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  updatePassword,
  toggle2FA
} = require('../controllers/settingsController');

// Middleware to ensure user is logged in and is an Admin
const { protect, restrictTo} = require('../middleware/auth');

/**
 * All routes here are prepended with /api/settings in server.js
 * Access: Private/Admin
 */

router.use(protect); 
router.use(restrictTo('admin', 'kitchen'));

// General Settings (GET & PUT)
router
  .route('/')
  .get(getSettings)
  .put(updateSettings);

// Security Specifics
router.put('/password', updatePassword);
router.patch('/2fa', toggle2FA);

module.exports = router;