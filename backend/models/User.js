const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator'); 

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
    maxLength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email address']
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true, 
    
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8, 
    select: false 
  },
  pin: {
    type: String,
    select: false, 
    minLength: 4,
    maxLength: 4,
    match: [/^\d{4}$/, 'PIN must be exactly 4 digits'] 
  },
  permissions: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  role: {
    type: String,
    enum: {
      values: ['admin', 'manager', 'kitchen', 'staff', 'customer'],
      message: '{VALUE} is not a valid role'
    },
    default: 'staff'
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'User must be linked to a restaurant'],
    index: true 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.pin;
      delete ret.__v;
      return ret;
    }
  }
});

UserSchema.index({ username: 1, restaurantId: 1 }, { unique: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') && !this.isModified('pin')) return next();
  
  const salt = await bcrypt.genSalt(10);

  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified('pin') && this.pin) {
    this.pin = await bcrypt.hash(this.pin, salt);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.comparePin = async function(candidatePin) {
  return await bcrypt.compare(candidatePin, this.pin);
};

module.exports = mongoose.model('User', UserSchema);