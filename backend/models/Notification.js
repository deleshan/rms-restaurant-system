const mongoose = require('mongoose');
 
const NotificationSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['new_order', 'low_stock', 'new_review', 'billing', 'system'],
    default: 'system',
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  // Optional reference to the source document (e.g. an Order _id)
  // so clicking the notification can navigate to it.
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  relatedType: {
    type: String,
    enum: ['Order', 'MenuItem', 'Review', null],
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });
 
// Fast lookups: unread-first, most-recent-first, scoped per restaurant
NotificationSchema.index({ restaurantId: 1, createdAt: -1 });
NotificationSchema.index({ restaurantId: 1, isRead: 1 });
 
module.exports = mongoose.model('Notification', NotificationSchema);