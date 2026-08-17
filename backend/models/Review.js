const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true,
  },

  customer: {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },

  itemRatings: {
    type: Map,
    of: Number,
    default: {}
  },
  
  foodRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  serviceRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  rating: {
    type: Number,
    index: true,
  },

  feedback: {
    type: String,
    trim: true,
    default: '',
  },
  photo: {
    type: String, 
    default: '',
  },

  //  AI Sentiment & Dish-Level Analytics
  sentimentScore: {
    type: Number, // Range: -1 (Negative) to 1 (Positive)
    default: 0,
  },
  sentimentLabel: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative', 'Not Analyzed'],
    default: 'Not Analyzed',
    index: true,
  },
  keywords: [{
    type: String,
  }],
  
  foodAnalysis: [{
    foodName: { type: String },
    sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative'] },
    textSegment: { type: String } 
  }],

  //  Admin Management
  isFlagged: {
    type: Boolean,
    default: false,
    index: true,
  },
  isHidden: {
    type: Boolean,
    default: false, 
  },
  adminReply: {
    type: String,
    default: '',
  },
  repliedAt: {
    type: Date, 
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// VIRTUALS
ReviewSchema.virtual('preciseRating').get(function () {
  return ((this.foodRating + this.serviceRating) / 2).toFixed(1);
});

// MIDDLEWARE
ReviewSchema.pre('save', async function() {
  if (this.isModified('foodRating') || this.isModified('serviceRating')) {
    this.rating = Math.round((this.foodRating + this.serviceRating) / 2);
  }
});

ReviewSchema.index({ createdAt: -1 }); 
ReviewSchema.index({ 'customer.name': 'text', feedback: 'text' }); 
ReviewSchema.index({ restaurantId: 1, rating: 1 }); 
ReviewSchema.index({ restaurantId: 1, isFlagged: 1 }); 
ReviewSchema.index({ restaurantId: 1, sentimentLabel: 1 });

module.exports = mongoose.model('Review', ReviewSchema);