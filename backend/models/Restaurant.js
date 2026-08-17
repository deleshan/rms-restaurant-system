const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxLength: [100, 'Name is too long'],
    set: v => validator.escape(v) 
  },
  cuisineType: {
    type: String,
    required: [true, 'Cuisine type is required'],
    trim: true,
    lowercase: true 
  },
 
  email: {
    type: String,
    required: [true, 'Business email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid business email']
  },
  phone: {
    type: String,
    required: [true, 'Contact phone is required'],
    trim: true,
    set: v => v.replace(/\D/g, ''),
    maxLength: [12, 'Phone number is too long']
  },
  countryCallingCode: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    required: [true, 'Physical address is required'],
    trim: true,
    set: v => validator.escape(v)
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    set: v => validator.escape(v)
  },
  country: {
    type: String,
    trim: true,
    uppercase: true,
    maxLength: [2, 'Use ISO country code (e.g. LK, US)'],
    default: ''
  },

  settings: {
    currency: { 
      type: String, 
      default: 'LKR', 
      uppercase: true, 
      trim: true,
      maxLength: 3 
    },
    taxRate: { 
      type: Number, 
      default: 0, 
      min: [0, 'Tax cannot be negative'], 
      max: [100, 'Tax cannot exceed 100%'] 
    },
    serviceCharge: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    openingTime: { type: String, default: '08:00' },
    closingTime: { type: String, default: '22:00' },
    isServiceChargeTaxable: { type: Boolean, default: false },
    enableKitchenDisplay: { type: Boolean, default: true },
    autoPrintReceipts: { type: Boolean, default: false },
    smsProviderKey: { type: String, select: false },
  },
  subscriptionPlan: {
    type: String,
    enum: {
      values: ['Free', 'Basic', 'Pro'],
      message: '{VALUE} is not a valid plan'
    },
    default: 'Basic',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  logoUrl: {
    type: String,
    default: '',
    validate: {
      validator: (v) => v === '' || validator.isURL(v),
      message: 'Logo must be a valid URL'
    }
  },

  //  FINANCIAL INITIALIZATION
  isInitialized: {
    type: Boolean,
    default: false
  },
  
  openingAuditTrail: {
    initialDate: { type: Date },
    setupBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    snapshot: {
      cash: { type: Number, default: 0, set: v => Math.round(v * 100) / 100 },
      bank: { type: Number, default: 0, set: v => Math.round(v * 100) / 100 },
      inventory: { type: Number, default: 0 },
      receivables: { type: Number, default: 0 },
      fixedAssets: { type: Number, default: 0 },
      liabilities: { type: Number, default: 0 },
      equity: { type: Number, default: 0 }
    }
  },

  //  REAL-TIME FINANCIAL POSITION
  currentBalance: {
    cash: { type: Number, default: 0, set: v => Math.round(v * 100) / 100 },
    bank: { type: Number, default: 0, set: v => Math.round(v * 100) / 100 },
    inventoryValue: { type: Number, default: 0 },
    accountsReceivable: { type: Number, default: 0 },
    propertyEquipment: { type: Number, default: 0 },
    accumulatedDepreciation: { type: Number, default: 0 },
    accountsPayable: { type: Number, default: 0 },
    shortTermDebt: { type: Number, default: 0 },
    longTermLoans: { type: Number, default: 0 },
    ownerCapital: { type: Number, default: 0 },
    retainedEarnings: { type: Number, default: 0 },
    externalInvestmentsHeld: { type: Number, default: 0 },
    total: { type: Number, default: 0 } 
  },

  
  
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.kitchenPin;
      delete ret.__v;
      return ret;
    }
  },
});

// MIDDLEWARE
// Security: Hash Kitchen PIN before saving
RestaurantSchema.pre('save', async function() {
  if (!this.isModified('kitchenPin')) return;
  const salt = await bcrypt.genSalt(10);
  this.kitchenPin = await bcrypt.hash(this.kitchenPin, salt);
 
});

const notificationSettingsSchema = new mongoose.Schema({

  // Email 
  email: {
    provider:    { type: String, enum: ['smtp', 'platform'], default: 'platform' },
    // 'platform' = use the system SMTP but send FROM vendor's address
    // 'smtp'     = vendor supplies their own SMTP credentials
    fromName:    { type: String },   // "Burger Palace"
    fromAddress: { type: String },   // billing@burgerpalace.com
    smtpHost:    { type: String },
    smtpPort:    { type: Number, default: 587 },
    smtpUser:    { type: String },
    smtpPass:    { type: String },   // store encrypted in production
    smtpSecure:  { type: Boolean, default: false },
  },

  // WhatsApp 
  whatsapp: {
    provider:     { type: String, enum: ['twilio', 'platform'], default: 'platform' },
    // 'platform' = use system Twilio account, messages branded per vendor
    // 'twilio'   = vendor supplies own Twilio sub-account
    fromNumber:   { type: String },  // whatsapp:+94771234567
    accountSid:   { type: String },
    authToken:    { type: String },
  },

  //  Branding (used in PDF & email body) 
  branding: {
    address:   { type: String },
    phone:     { type: String },
    website:   { type: String },
    logoUrl:   { type: String },
    taxNumber: { type: String },
    footerNote:{ type: String, default: 'Thank you for dining with us!' },
  },

}, { _id: false });


RestaurantSchema.pre('save', function() {
  this.currentBalance.total = (this.currentBalance.cash || 0) + (this.currentBalance.bank || 0);
  
});

// Method to verify Kitchen PIN
RestaurantSchema.methods.compareKitchenPin = async function(candidatePin) {
  return await bcrypt.compare(candidatePin, this.kitchenPin);
};

// VIRTUALS
RestaurantSchema.virtual('liquidLiquidity').get(function() {
  return this.currentBalance.cash + this.currentBalance.bank;
});

RestaurantSchema.virtual('netWorth').get(function() {
  const b = this.currentBalance;
  const totalAssets = b.cash + b.bank + b.inventoryValue + b.accountsReceivable + (b.propertyEquipment - b.accumulatedDepreciation);
  const totalLiabilities = b.accountsPayable + b.shortTermDebt + b.longTermLoans;
  return totalAssets - totalLiabilities;
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);