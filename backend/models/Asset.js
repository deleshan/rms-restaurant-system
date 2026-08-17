const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  purchaseDate: {
    type: Date,
    required: true,
  },
  purchaseCost: {
    type: Number,
    required: true,
    min: 0,
  },
  currentValue: {
    type: Number,
    min: 0,
    default: function () {
      return this.purchaseCost;
    },
  },
  depreciationRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0, 
  },
  status: {
    type: String,
    enum: ['Active', 'Sold', 'Disposed', 'Under Maintenance'],
    default: 'Active',
  },
  notes: {
    type: String,
    default: '',
  },
  image: {
    type: String, 
    default: '',
  },
  restaurantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Restaurant',
  required: true,
  index: true, 
},
assetType: {
    type: String,
    enum: ['Vehicle','Equipment & Tools', 'Furniture', 'Machinery', 'Land', 'Building'],
    required: true,
  },
  usefulLife: {
    type: Number, // In years
    default: 5
  },
  salvageValue: {
    type: Number,
    default: 0
  },
  isInitial: {
    type: Boolean,
    default: false 
  },
  depreciationMethod: {
  type: String,
  enum: ['straight-line', 'declining-balance'],
  default: 'straight-line',
},
  // Disposal (Sales) Info
  salePrice: { type: Number },
  saleDate: { type: Date },
  gainLoss: { type: Number }
}, {
  timestamps: true, 
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});

AssetSchema.virtual('bookValue').get(function () {
  if (this.assetType === 'Land') return this.purchaseCost;

  const yearsOwned =
    (new Date() - new Date(this.purchaseDate)) / (1000 * 60 * 60 * 24 * 365.25);
  const life = this.usefulLife || 5;

  if (this.depreciationMethod === 'declining-balance') {
    const rate = 2 / life;
    
    const bv = this.purchaseCost * Math.pow(1 - rate, yearsOwned);
    return +Math.max(bv, this.salvageValue || 0).toFixed(2);
  }

  
  const annualDeprec = (this.purchaseCost - (this.salvageValue || 0)) / life;
  const totalDeprec  = Math.min(annualDeprec * yearsOwned, this.purchaseCost - (this.salvageValue || 0));
  return +Math.max(this.purchaseCost - totalDeprec, 0).toFixed(2);
});



AssetSchema.virtual('depreciatedValue').get(function () {
  if (this.depreciationRate === 0) return this.currentValue;

  const years = (new Date() - this.purchaseDate) / (1000 * 60 * 60 * 24 * 365);
  const depreciation = this.purchaseCost * (this.depreciationRate / 100) * years;
  return Math.max(this.purchaseCost - depreciation, 0);
});



AssetSchema.index({ assetType: 1 });
AssetSchema.index({ status: 1 });

module.exports = mongoose.model('Asset', AssetSchema);