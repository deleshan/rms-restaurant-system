const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['SALE', 'RESTOCK', 'WASTE', 'ADJUSTMENT', 'KITCHEN_REQUEST', 'CUSTOMIZATION'],
    required: true
  },
  quantityChange: {
    type: Number,
    required: true  // negative = deduction, positive = addition
  },
  quantityBefore: { type: Number, required: true },
  quantityAfter:  { type: Number, required: true },

  // Cost snapshot at time of movement (critical - prices change!)
  costPerUnitAtTime: { type: Number, default: 0 },
  totalCostImpact:   { type: Number, default: 0 },  // quantityChange * costPerUnit

  // Reference linking
  referenceType: {
    type: String,
    enum: ['ORDER', 'PURCHASE', 'MANUAL', 'KITCHEN_REQUEST']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },

 
  menuItemId:  { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  orderItemId: { type: mongoose.Schema.Types.ObjectId },

  notes: { type: String, trim: true },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isSystemGenerated: { type: Boolean, default: false }

}, { timestamps: true });

// Index for fast reporting queries
StockMovementSchema.index({ restaurantId: 1, createdAt: -1 });
StockMovementSchema.index({ restaurantId: 1, type: 1 });
StockMovementSchema.index({ referenceId: 1 });

module.exports = mongoose.model('StockMovement', StockMovementSchema);