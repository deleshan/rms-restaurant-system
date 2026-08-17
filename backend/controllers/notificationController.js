const Notification = require('../models/Notification');
 
/**
 * @desc    Get recent notifications for the logged-in restaurant
 * @route   GET /api/notifications
 * @access  Protected (Admin, Kitchen)
 */
exports.getNotifications = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
 
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ restaurantId })
        .sort({ createdAt: -1 })
        .limit(limit),
      Notification.countDocuments({ restaurantId, isRead: false }),
    ]);
 
    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};
 
/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Protected (Admin, Kitchen)
 */
exports.markAsRead = async (req, res) => {
  try {
    const { restaurantId } = req.user;
 
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, restaurantId },
      { $set: { isRead: true } },
      { new: true }
    );
 
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
 
    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};
 
/**
 * @desc    Mark all notifications as read for this restaurant
 * @route   PATCH /api/notifications/read-all
 * @access  Protected (Admin, Kitchen)
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const { restaurantId } = req.user;
 
    await Notification.updateMany(
      { restaurantId, isRead: false },
      { $set: { isRead: true } }
    );
 
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};
 
/**
 * @desc    Clear (delete) all notifications for this restaurant
 * @route   DELETE /api/notifications
 * @access  Protected (Admin, Kitchen)
 */
exports.clearAllNotifications = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    await Notification.deleteMany({ restaurantId });
    res.status(200).json({ success: true, message: 'Notifications cleared' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear notifications' });
  }
};