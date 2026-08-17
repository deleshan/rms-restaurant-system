const express = require('express');
const router = express.Router();
const {
  adminLogin,
  kitchenLogin,
  verifyToken,
  registerBusiness,
  getMe,
  updateNotificationSettings,
  updateKitchenPin 
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth'); 

// Public routes
router.post('/admin', adminLogin);
router.post('/login', kitchenLogin);
router.post('/kitchen-login', kitchenLogin);

router.post('/register-business', registerBusiness);


// Protected route (test token)
router.get('/verify', protect, verifyToken);
router.get('/me', protect, getMe);
router.patch('/notification-settings', protect, updateNotificationSettings);

router.patch('/kitchen/pin', protect, admin, updateKitchenPin);

module.exports = router;