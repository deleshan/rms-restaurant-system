const mongoose = require('mongoose');
const validator = require('validator');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters'],
    set: v => v ? validator.escape(v) : v
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    set: v => v.replace(/\D/g, '')
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required'],
    index: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
    validate: {
      validator: function(v) {
        return v === null || validator.isEmail(v);
      },
      message: 'Please provide a valid email'
    }
  },
  homeAddress: {
    type: String,
    trim: true,
    maxLength: [250, 'Address is too long'],
    default: null,
    set: v => v ? validator.escape(v) : null
  },
  dateOfBirth: {
    type: Date,
    default: null,
    validate: {
      validator: function(v) {
        return !v || v <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  totalOrders: {
    type: Number,
    default: 0,    
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent cannot be negative'],
    set: v => Math.round(v * 100) / 100
  },
  lastVisit: {
    type: Date,
    default: Date.now,
  },
  segment: {
    type: String,
    enum: {
      values: ['New', 'Regular', 'Loyal', 'VIP', 'At-Risk', 'Inactive'],
      message: '{VALUE} is not a valid segment'
    },
    default: 'New',
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    default: '',
    trim: true,
    maxLength: [500, 'Notes cannot exceed 500 characters'],
    set: v => v ? validator.escape(v) : ''  
  },
  optedInForMarketing: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastBirthdayReminderSentYear: {
    type: Number,
    default: null,
  },
  lastBirthdayOfferSentYear: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

CustomerSchema.index({ phone: 1, restaurantId: 1 }, { unique: true });
CustomerSchema.index({ segment: 1 });
CustomerSchema.index({ lastVisit: -1 });
CustomerSchema.index({ restaurantId: 1, segment: 1 });

CustomerSchema.pre('save', async function(){
  if (this.isModified('totalSpent')) {
    this.loyaltyPoints = Math.floor(this.totalSpent / 100);
  }

  if (this.isModified('totalOrders')) {
    if (this.totalOrders > 10) this.segment = 'Loyal';
    else if (this.totalOrders > 5) this.segment = 'Regular';
  }

});

module.exports = mongoose.model('Customer', CustomerSchema);