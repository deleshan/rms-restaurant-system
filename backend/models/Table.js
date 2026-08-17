const mongoose = require('mongoose');


const tableSchema = new mongoose.Schema(
  {
    // Link to the Restaurant (Multi-tenant support)
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'A table must belong to a restaurant'],
      index: true,
    },
    // The identifier shown to customers (e.g., "01", "A5", "VIP-1")
    tableNumber: {
      type: String,
      required: [true, 'Table number is required'],
      trim: true,
    },
    // Seating capacity for analytics and reservation features
    capacity: {
      type: Number,
      default: 4,
      min: [1, 'Capacity must be at least 1'],
    },
    // The operational state of the table
    status: {
      type: String,
      enum: {
        values: ['Active', 'Inactive', 'Occupied', 'Reserved'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Active',
    },
    qrMetadata: {
      generatedAt: { type: Date },
      timesScanned: { type: Number, default: 0 },
    },
    // Track current active session (linked to an Order)
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
  },
  { 
    timestamps: true 
  }
);

// COMPOUND INDEX: Prevents duplicate table numbers within the SAME restaurant
// But allows different restaurants to have the same table numbers.
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

// PRE-SAVE HOOK: Example of logic before saving
tableSchema.pre('save', function (next) {
  if (this.tableNumber) {
    this.tableNumber = this.tableNumber.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Table', tableSchema);