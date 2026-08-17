const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Settings = require('../models/Settings');

/**
 * Generate JWT Token
 * Explicitly extracts fields to avoid [object Object] serialization errors.
 */
const generateToken = (data) => {
  let payload = {};

  if (typeof data === 'object' && data !== null) {
    
    payload = {
      id: (data.id || data._id)?.toString(),
      role: data.role,
      restaurantId: data.restaurantId?.toString()
    };
  } else {
    payload = { id: data.toString() };
  }
  if (typeof payload.id === 'object') {
    payload.id = JSON.stringify(payload.id);
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Admin Login (Email + Password)
// @route   POST /api/auth/admin
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const allowedRoles = ['admin', 'superadmin', 'manager'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ 
      id: user._id, 
      role: user.role, 
      restaurantId: user.restaurantId 
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Kitchen Login (Restaurant ID + PIN)
const kitchenLogin = async (req, res) => {
  try {
    const { username, pin } = req.body;

    console.log(" Login Attempt → Username:", username, "| PIN:", pin);

    if (!username || !pin) {
      return res.status(400).json({ success: false, message: "Username and PIN are required" });
    }

    const settings = await Settings.findOne({ 
      kitchenUsername: { $regex: new RegExp(`^${username}$`, 'i') } 
    });

    if (!settings) {
      console.log(" Settings not found for username:", username);
      return res.status(401).json({ success: false, message: 'Invalid Kitchen Username' });
    }

    console.log(" Settings found. Stored PIN:", settings.kitchenPin);
    console.log("Comparing with input PIN:", pin);

    const isMatch = await settings.compareKitchenPin(pin);
    console.log("PIN Match Result:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Kitchen PIN' });
    }

    const restaurant = await Restaurant.findById(settings.restaurantId)
      .select('name cuisineType isActive');

    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({ success: false, message: 'Restaurant not found or inactive' });
    }

    const token = jwt.sign(
      { 
        id: 'kitchen_device', 
        role: 'kitchen', 
        restaurantId: settings.restaurantId.toString() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(" Kitchen Login Successful for:", restaurant.name);

    res.status(200).json({
      success: true,
      token,
      role: 'kitchen',
      restaurantId: settings.restaurantId.toString(),
      data: {
        _id: restaurant._id,
        name: restaurant.name,
        cuisineType: restaurant.cuisineType
      }
    });

  } catch (error) {
    console.error("KITCHEN LOGIN ERROR:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Verify Token
const verifyToken = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user, 
  });
};

// @desc    Register Business (Wizard Flow)
const registerBusiness = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { 
      restaurantName, cuisineType, address, city, phone, country,
      currency, taxRate, openingTime, closingTime,
      adminEmail, username, password,
      kitchenUsername, kitchenPin 
    } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email: adminEmail }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }

    // Create Restaurant
    const restaurant = await Restaurant.create([{
      name: restaurantName,
      cuisineType,
      email: adminEmail,
      address, city, phone, country,
      settings: { currency, taxRate, openingTime, closingTime }
    }], { session });

    const restaurantId = restaurant[0]._id;

    // Create THE SETTINGS DOCUMENT (This fixes the blank profile page)
    await Settings.create([{
      restaurantId: restaurantId,
      restaurantName: restaurantName,
      email: adminEmail,
      phone: phone,
      address: address,
      kitchenUsername: kitchenUsername || `${restaurantName.replace(/\s+/g, '_').toLowerCase()}_kitchen`,
      kitchenPin: kitchenPin || '1234',
      currency: currency || 'LKR',
      taxRate: taxRate || 0,
    }], { session });

    // Create Admin User
    const user = await User.create([{
      name: username,
      email: adminEmail,
      username: username,
      password, 
      role: 'admin',
      restaurantId: restaurantId 
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Generate Token
    const token = generateToken({
      id: user[0]._id,
      role: user[0].role,
      restaurantId: user[0].restaurantId
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user[0]._id,
        name: user[0].name,
        role: user[0].role,
        restaurantId: user[0].restaurantId
      }
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get current authenticated user/kitchen profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    if (req.user.role === 'kitchen') {
      const restaurant = await Restaurant.findById(req.user.restaurantId)
        .select('name cuisineType settings isActive');

      if (!restaurant || !restaurant.isActive) {
        return res.status(404).json({ 
          success: false, 
          message: 'Restaurant not found or inactive' 
        });
      }

      return res.status(200).json({
        success: true,
        role: 'kitchen',
        restaurantId: req.user.restaurantId,
        data: restaurant
      });
    }

    // Admin / Staff login
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      role: user.role,
      restaurantId: user.restaurantId,
      data: user
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Update Kitchen PIN (from Dashboard Settings)
 * @route   PATCH /api/auth/kitchen/pin
 * @access  Private (Kitchen/Admin)
 */
const updateKitchenPin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const restaurantId = req.user.restaurantId;

    if (!newPin || newPin.length < 4) {
      return res.status(400).json({ success: false, message: 'New PIN must be at least 4 digits' });
    }

    const settings = await Settings.findOne({ restaurantId });
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    const isMatch = await settings.compareKitchenPin(currentPin);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current PIN is incorrect' });
    }

    settings.kitchenPin = newPin;
    await settings.save();

    res.status(200).json({ success: true, message: 'Kitchen PIN updated successfully' });
  } catch (error) {
    console.error('Update PIN error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Update notification settings for a restaurant
 * @route   PATCH /api/restaurants/notification-settings
 * @access  Protected (Admin)
 */
const updateNotificationSettings = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    const { email, whatsapp, branding } = req.body;

    // Build update object - only update keys that were sent
    const updateData = {};
    if (email)     updateData['notificationSettings.email']    = email;
    if (whatsapp)  updateData['notificationSettings.whatsapp'] = whatsapp;
    if (branding)  updateData['notificationSettings.branding'] = branding;

    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('name notificationSettings');

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    res.status(200).json({
      success:  true,
      message:  'Notification settings updated',
      settings: restaurant.notificationSettings,
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

module.exports = {
  adminLogin,
  kitchenLogin,
  verifyToken,
  registerBusiness,
  updateKitchenPin,
  getMe,
  updateNotificationSettings,
};