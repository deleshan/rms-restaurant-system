const Customer = require('../models/Customer');

// @desc    Register or identify customer (from QR form)
// @route   POST /api/customers
// @access  Public
const registerCustomer = async (req, res) => {
  try {
    console.log('=== registerCustomer called ===');
    console.log('body:', req.body);
    const { name, phone, email, homeAddress, dateOfBirth, tableId, restaurantId } = req.body;

    if (!name || !phone || !restaurantId) {
      return res.status(400).json({ message: 'Name, phone, and restaurantId are required' });
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ phone: normalizedPhone, restaurantId });
    console.log('existingCustomer:', existingCustomer ? {
      id: existingCustomer._id,
      dateOfBirth: existingCustomer.dateOfBirth,
      email: existingCustomer.email
    } : 'NOT FOUND');


    let customer;

    if (existingCustomer) {
      // RETURNING CUSTOMER
      // Only update fields that are safe to always update
      // NEVER overwrite email/DOB with null — preserve existing values
      const updateFields = {
        name: name.trim(),
        lastVisit: new Date(),
      };

      if (homeAddress?.trim()) updateFields.homeAddress = homeAddress.trim();

      // Only update email if user provided one AND customer has none
      if (email?.trim() && !existingCustomer.email) {
        updateFields.email = email.trim().toLowerCase();
      }

      // Only update DOB if user provided one AND customer has none
      if (dateOfBirth && !existingCustomer.dateOfBirth) {
        updateFields.dateOfBirth = dateOfBirth;
      }

      customer = await Customer.findOneAndUpdate(
        { phone: normalizedPhone, restaurantId },
        { 
          $set: updateFields,
        },
        { new: true }  // returns updated doc with ALL fields including existing email/DOB
      );

    } else {
      // NEW CUSTOMER
      customer = await Customer.create({
        name: name.trim(),
        phone: normalizedPhone,
        restaurantId,
        email: email ? email.trim().toLowerCase() : null,
        dateOfBirth: dateOfBirth || null,
        homeAddress: homeAddress ? homeAddress.trim() : null,
        lastVisit: new Date(),
        totalOrders: 1,
        totalSpent: 0,
      });
    }

    // Always return full customer object including existing email/DOB
    res.status(200).json({
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
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This phone number is already registered at this restaurant.' });
    }
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