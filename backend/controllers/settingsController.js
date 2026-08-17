const Settings = require('../models/Settings');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

const ALLOWED_SETTINGS_FIELDS = [
  'restaurantName',
  'email',
  'phone',
  'address',
  'currency',
  'taxRate',
  'serviceCharge',
];

/**
 * @desc    Get restaurant settings
 * @route   GET /api/settings
 * @access  Private/Admin
 */
exports.getSettings = async (req, res) => {
  try {
    const { restaurantId } = req.user;
    let settings = await Settings.findOne({ restaurantId });
    const restaurant = await Restaurant.findById(restaurantId)
      .select('cuisineType logoUrl settings.openingTime settings.closingTime');

    if (!settings) {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
      }
      
      settings = await Settings.create({
        restaurantId,
        restaurantName: restaurant.name,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        kitchenUsername: `${restaurant.name.replace(/\s+/g, '_').toLowerCase()}_kitchen`,
        kitchenPin: '2127',
      });
    }
    const merged = {
      ...settings.toObject(),
      cuisineType: restaurant?.cuisineType,
      logoUrl: restaurant?.logoUrl,
      openingTime: restaurant?.settings?.openingTime,
      closingTime: restaurant?.settings?.closingTime,
    };

    res.status(200).json({ success: true, settings: merged });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

/**
 * @desc    Update restaurant settings
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
exports.updateSettings = async (req, res) => {
  try {
    const { restaurantId } = req.user;

    const safeBody = {};
    for (const key of ALLOWED_SETTINGS_FIELDS) {
      if (req.body[key] !== undefined) safeBody[key] = req.body[key];
    }
    const updates = flattenObject(safeBody);

    const settings = await Settings.findOneAndUpdate(
      { restaurantId },
      { $set: updates },
      { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
    );

    const identityFields = {};
    if (req.body.restaurantName) identityFields.name = req.body.restaurantName;
    if (req.body.phone) identityFields.phone = req.body.phone;
    if (req.body.address) identityFields.address = req.body.address;

    if (Object.keys(identityFields).length > 0) {
      await Restaurant.findByIdAndUpdate(restaurantId, identityFields);
    }

    res.status(200).json({ success: true, message: 'Settings saved', settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};


/**
 * @desc    Update Admin Password
 * @route   PUT /api/settings/password
 * @access  Private/Admin
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const admin = await User.findById(req.user.id).select('+password');

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle 2FA Status
 * @route   PATCH /api/settings/2fa
 * @access  Private/Admin
 */
exports.toggle2FA = async (req, res) => {
  try {
    const { enable } = req.body;
    const { restaurantId } = req.user; 

    const settings = await Settings.findOneAndUpdate(
      { restaurantId },                      
      { $set: { twoFactorAuth: enable } },   
      { new: true, runValidators: true }
    );

    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    res.status(200).json({
      success: true,
      enable: settings.twoFactorAuth,
      message: `2FA has been ${enable ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};