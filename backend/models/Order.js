const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  },
  name: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    default: null,
  },
  station: {
    type: String,
    enum: ['Hot Station', 'Cold Station', 'Bar / Drinks'],
    required: true,
  },
  customizations: {
    type: [String],
    default: [],
  },
  prepDurationSeconds: {
    type: Number,
    default: null,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },

    tableId: {
      type: String,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },

    items: [orderItemSchema],

    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },

    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
      default: 'Pending',
    },

    // Billing Flow Fields
    billRequested: {
      type: Boolean,
      default: false,
    },
    billRequestedAt: {
      type: Date,
    },
    billingPreference: {
      type: String,
      enum: ['Email', 'SMS', 'Printed Bill', null],
      default: null,
    },
    isBillSent: {
      type: Boolean,
      default: false,
    },

    // Payment Logic
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      default: 'Cash',
    },

    // Kitchen Tracking
    specialRequest: {
      type: String,
      default: '',
    },
    prepStartTime: {
      type: Date,
    },
    readyTime: {
      type: Date,
    },
    completedTime: {
      type: Date,
    },
    prepDurationSeconds: {
      type: Number,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


orderSchema.virtual('stations').get(function () {
  return [...new Set(this.items.map(i => i.station).filter(Boolean))];
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// Indexes for KDS performance
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

