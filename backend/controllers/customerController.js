const Customer = require('../models/Customer');

// @desc    Register or identify customer (from QR form)
// @route   POST /api/customers
// @access  Public
const registerCustomer = async (req, res) => {
  try {
    const { name, phone, email, homeAddress, dateOfBirth, tableId, restaurantId } = req.body;

    if (!name || !phone || !restaurantId) {
      return res.status(400).json({ message: 'Name, phone, and restaurantId are required' });
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    // Pre-sanitize optional fields ourselves. A typo'd email or a bad DOB
    // must never fail the whole check-in — we just drop the bad value.
    const safeEmail = email && validator.isEmail(email.trim()) ? email.trim().toLowerCase() : null;
    const safeDOB = dateOfBirth && new Date(dateOfBirth) <= new Date() ? dateOfBirth : null;
    const safeAddress = homeAddress?.trim() ? validator.escape(homeAddress.trim()) : null;

    const existingCustomer = await Customer.findOne({ phone: normalizedPhone, restaurantId });

    let customer;

    if (existingCustomer) {
      // RETURNING CUSTOMER — always accept whatever name they typed this time,
      // even if it doesn't match what's on file. Never reject on mismatch.
      const updateFields = {
        name: name.trim(),
        lastVisit: new Date(),
      };
      if (safeAddress) updateFields.homeAddress = safeAddress;
      if (safeEmail && !existingCustomer.email) updateFields.email = safeEmail;
      if (safeDOB && !existingCustomer.dateOfBirth) updateFields.dateOfBirth = safeDOB;

      customer = await Customer.findOneAndUpdate(
        { phone: normalizedPhone, restaurantId },
        { $set: updateFields },
        { new: true }
      );
    } else {
      // NEW CUSTOMER at this restaurant
      try {
        customer = await Customer.create({
          name: name.trim(),
          phone: normalizedPhone,
          restaurantId,
          email: safeEmail,
          dateOfBirth: safeDOB,
          homeAddress: safeAddress,
          lastVisit: new Date(),
          totalOrders: 1,
          totalSpent: 0,
        });
      } catch (createErr) {
        // Genuine race (two simultaneous first-time check-ins for the same
        // phone+restaurant) hits the compound unique index. Recover instead
        // of failing — treat it as a returning customer.
        if (createErr.code === 11000) {
          customer = await Customer.findOneAndUpdate(
            { phone: normalizedPhone, restaurantId },
            { $set: { name: name.trim(), lastVisit: new Date() } },
            { new: true, upsert: true }
          );
        } else {
          throw createErr;
        }
      }
    }

    return res.status(200).json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        dateOfBirth: customer.dateOfBirth,
        homeAddress: customer.homeAddress,
        segment: customer.segment,
        loyaltyPoints: customer.loyaltyPoints,
        restaurantId: customer.restaurantId,
        tableId,
      },
    });
  } catch (error) {
    console.error('Register customer error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// @desc    Get customer by phone (Scoped to Restaurant)
// @route   GET /api/customers/:phone?restaurantId=...
// @access  Public
const getCustomerByPhone = async (req, res) => {
  try {
    const { restaurantId } = req.query; 
    const normalizedPhone = req.params.phone.replace(/\D/g, '');

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required for search' });
    }

    const customer = await Customer.findOne({ phone: normalizedPhone, restaurantId });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found at this restaurant' });
    }

    res.status(200).json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        homeAddress: customer.homeAddress,
        dateOfBirth: customer.dateOfBirth,
        restaurantId: customer.restaurantId,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        segment: customer.segment,
        loyaltyPoints: customer.loyaltyPoints,
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update customer details
// @route   PUT /api/customers/:phone
// @access  Public
const updateCustomer = async (req, res) => {
  try {
    const { restaurantId } = req.body;
    const normalizedPhone = req.params.phone.replace(/\D/g, '');

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant context is required' });
    }

    // Only include fields that were actually sent
    const updateFields = {};
    if (req.body.name)        updateFields.name        = req.body.name;
    if (req.body.email)       updateFields.email       = req.body.email;
    if (req.body.homeAddress) updateFields.homeAddress = req.body.homeAddress;
    if (req.body.dateOfBirth) updateFields.dateOfBirth = req.body.dateOfBirth;

    const customer = await Customer.findOneAndUpdate(
      { phone: normalizedPhone, restaurantId },
      { $set: updateFields },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      customer: {
        _id:         customer._id,
        name:        customer.name,
        phone:       customer.phone,
        email:       customer.email,
        homeAddress: customer.homeAddress,
        dateOfBirth: customer.dateOfBirth,
      },
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerCustomer,
  getCustomerByPhone,
  updateCustomer,
};