const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    default: () => `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  expiryDate: {
    type: Date,
    required: false,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  costPerBatchUnit: {
    type: Number,
    min: 0,
    default: 0,
  }
});

const InventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  sku: { 
    type: String, 
    trim: true,
    index: true 
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  unit: {
    type: String,
    required: true,
    default: 'piece',
  },
  
  // BATCH TRACKING 
  batches: [BatchSchema],

  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  
  minimumStock: {
    type: Number,
    min: 0,
    default: 5, 
  },

  expiryDate: {
    type: Date,
    required: false 
  },

  isAvailable: {
    type: Boolean,
    default: true,
  },
  location: {
    type: String,
    default: 'Main Storage',
  },
  costPerUnit: {
    type: Number,
    min: 0,
    default: 0,
  },
  supplier: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    enum: ['Produce', 'Meat', 'Dairy', 'Spices', 'Grains', 'Beverages', 'Dry Goods', 'Packaging', 'Assets', 'Other'],
    default: 'Other',
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true, 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// MIDDLEWARE

// Automatically update currentStock and earliest expiryDate before saving
InventorySchema.pre('save', function (next) {
  if (this.batches && Array.isArray(this.batches) && this.batches.length > 0) {
    this.currentStock = this.batches.reduce((acc, batch) => acc + (batch.quantity || 0), 0);
    const dates = this.batches
      .map(b => b.expiryDate)
      .filter(d => d instanceof Date && !isNaN(d));
    if (dates.length > 0) {
      this.expiryDate = new Date(Math.min(...dates));
    }
  } else {
    this.currentStock = this.currentStock || 0;
  }
});

// VIRTUALS 

InventorySchema.virtual('isCriticalStock').get(function () {
  return this.currentStock <= (this.minimumStock * 0.2);
});

InventorySchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minimumStock;
});

InventorySchema.virtual('totalValue').get(function () {
  return (this.currentStock * this.costPerUnit) || 0;
});

// Returns only batches that haven't expired yet
InventorySchema.virtual('activeBatches').get(function () {
  const now = new Date();
  if (!this.batches || !Array.isArray(this.batches)) return [];
  
  return this.batches.filter(batch => batch.expiryDate && batch.expiryDate > now);
});

// INDEXES 

InventorySchema.index({ name: 1, restaurantId: 1 }, { unique: true });
InventorySchema.index({ sku: 1, restaurantId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Inventory', InventorySchema);