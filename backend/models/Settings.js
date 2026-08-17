const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SettingsSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    unique: true,
    index: true
  },

  restaurantName: {
    type: String,
    trim: true,
    default: 'My Restaurant'
  },

  kitchenUsername: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },

  kitchenPin: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 4,
    default: '1234'
  },

  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  currency: { type: String, enum: ['LKR', 'USD', 'EUR', 'GBP'], default: 'LKR' },
  taxRate: { type: Number, min: 0, max: 100, default: 10 },
  serviceCharge: { type: Number, min: 0, max: 100, default: 10 },
  twoFactorAuth: { type: Boolean, default: false },

}, { timestamps: true });

SettingsSchema.pre('save', async function () {
  if (!this.isModified('kitchenPin')) return;
  const salt = await bcrypt.genSalt(10);
  this.kitchenPin = await bcrypt.hash(this.kitchenPin, salt);
});

SettingsSchema.methods.compareKitchenPin = async function (candidatePin) {
  return await bcrypt.compare(candidatePin.toString(), this.kitchenPin);
};

module.exports = mongoose.model('Settings', SettingsSchema);