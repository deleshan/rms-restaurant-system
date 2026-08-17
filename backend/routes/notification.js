const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} = require('../controllers/notificationController');
 
const { protect, restrictTo } = require('../middleware/auth');
 
// All notification routes require login as Admin or Kitchen staff 
// matches the same access pattern as your order routes.
router.use(protect);
router.use(restrictTo('admin', 'kitchen'));
 
router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/', clearAllNotifications);
 
module.exports = router;