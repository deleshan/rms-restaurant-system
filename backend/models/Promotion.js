const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Promotion title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      index: true, 
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'bogo', 'freeItem'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, 'Value cannot be negative'],
    },
    targetSegment: {
      type: String,
      enum: ['All', 'New', 'Regular', 'Loyal', 'VIP', 'Birthday'],
      default: 'All',
    },
    
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maxRedemptions: {
      type: Number,
      default: null, 
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    totalDiscountApplied: {
      type: Number,
      default: 0, 
    },
    isAutomatedBirthdayCampaign: {
      type: Boolean,
      default: false,
    },
    reminderDaysBefore: {
      type: Number,
      default: 3,
      min: [0, 'Reminder days cannot be negative'],
    },
    reminderMessageTemplate: {
      type: String,
      trim: true,
      default:
        'Hi {customerName}! Your birthday is coming up in {reminderDaysBefore} days. Get ready for a special treat from {restaurantName}!',
    },
    birthdayMessageTemplate: {
      type: String,
      trim: true,
      default:
        'Happy Birthday {customerName}! Enjoy {discount} off with code {code}, on us. Valid today only at {restaurantName}!',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


PromotionSchema.index({ title: 'text', code: 'text' });


PromotionSchema.virtual('isExpired').get(function () {
  return this.endDate && new Date(this.endDate) < new Date();
});


PromotionSchema.virtual('isLimitReached').get(function () {
  if (!this.maxRedemptions) return false;
  return this.usageCount >= this.maxRedemptions;
});

module.exports = mongoose.model('Promotion', PromotionSchema);