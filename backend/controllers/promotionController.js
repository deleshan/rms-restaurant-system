const Promotion = require('../models/Promotion');
const Customer = require('../models/Customer');
const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const mailchimp = require('@mailchimp/mailchimp_marketing');

// Configure Mailchimp
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

// @desc    Get all promotions (with search and status filters)
// @route   GET /api/promotions
// @access  Private (admin)
const getPromotions = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    const promotions = await Promotion.find({ restaurantId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      promotions,
      totalCount: promotions.length,
    });
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// @desc    Create new promotion
// @route   POST /api/promotions
const createPromotion = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    
    
    if (req.body.code) {
      const existing = await Promotion.findOne({ 
        restaurantId, 
        code: req.body.code.trim().toUpperCase() 
      });
      if (existing) {
        return res.status(400).json({ message: 'Promo code already exists for your restaurant' });
      }
    }

    const promotion = new Promotion({
      ...req.body,
      restaurantId,
      code: req.body.code?.trim().toUpperCase(),
      usageCount: 0,
      totalDiscountApplied: 0
    });

    await promotion.save();
    res.status(201).json({ success: true, promotion });
  } catch (error) {
    res.status(500).json({ message: 'Error creating promotion' });
  }
};

// @desc    Update promotion
// @route   PUT /api/promotions/:id
const updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });

    res.status(200).json({ success: true, promotion });
  } catch (error) {
    res.status(500).json({ message: 'Error updating promotion' });
  }
};

// @desc    Toggle promotion active/inactive status
// @route   PATCH /api/promotions/:id/status
const toggleStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const promotion = await Promotion.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { isActive },
      { new: true }
    );

    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });

    res.status(200).json({ success: true, promotion });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status' });
  }
};

// @desc    Delete promotion
// @route   DELETE /api/promotions/:id
const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });

    res.status(200).json({ success: true, message: 'Promotion deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting promotion' });
  }
};



// @desc    Launch promotion campaign (SMS/Email)
// @route   POST /api/promotions/:id/launch
const launchPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!promotion || !promotion.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive promotion' });
    }

    // Target Segment Logic
    let query = { restaurantId: req.user.restaurantId };
    if (promotion.targetSegment === 'Birthday') {
      const currentMonth = new Date().getMonth() + 1;
      query.$expr = { $eq: [{ $month: '$dateOfBirth' }, currentMonth] };
    } else if (promotion.targetSegment !== 'All') {
      query.segment = promotion.targetSegment;
    }

    const targetCustomers = await Customer.find(query);

    if (targetCustomers.length === 0) {
      return res.status(400).json({ message: 'No customers found in this segment' });
    }

    const discountLabel =
      promotion.discountType === 'percentage'
        ? `${promotion.discountValue}%`
        : `Rs.${promotion.discountValue}`;

    const smsMessage = `Special Offer: ${promotion.title}. Use code ${promotion.code} for ${discountLabel} off!`;

    // SMS via Twilio 
    let smsCount = 0;
    for (const customer of targetCustomers) {
      if (customer.phone) {
        try {
          await twilio.messages.create({
            body: smsMessage,
            from: process.env.TWILIO_WHATSAPP_FROM,
            to: `whatsapp:${customer.phone}`,
          });
          smsCount++;
        } catch (err) {
          console.error('Twilio Error:', err.message);
        }
      }
    }

    // Email via Mailchimp
    let emailCount = 0;
    const emailRecipients = targetCustomers.filter(
      (c) => c.email && c.optedInForMarketing
    );

    if (emailRecipients.length > 0) {
      try {
        // Create a campaign for this promotion
        const campaign = await mailchimp.campaigns.create({
          type: 'regular',
          recipients: { list_id: process.env.MAILCHIMP_LIST_ID },
          settings: {
            subject_line: `${promotion.title} — ${discountLabel} Off!`,
            from_name: req.user.restaurantName || 'Our Restaurant',
            reply_to: process.env.MAILCHIMP_REPLY_TO_EMAIL,
          },
        });

        // Set the campaign HTML content
        await mailchimp.campaigns.setContent(campaign.id, {
          html: `
            <h2>${promotion.title}</h2>
            <p>${promotion.description || ''}</p>
            <p>Use code <strong>${promotion.code}</strong> for <strong>${discountLabel} off</strong>!</p>
            <p>Valid until ${new Date(promotion.endDate).toLocaleDateString()}.</p>
          `,
        });

        // Send it
        await mailchimp.campaigns.send(campaign.id);
        emailCount = emailRecipients.length;
      } catch (err) {
        console.error('Mailchimp Error:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Campaign launched: ${smsCount} SMS sent, ${emailCount} emails queued via Mailchimp.`,
    });
  } catch (error) {
    console.error('Launch promotion error:', error);
    res.status(500).json({ message: 'Campaign launch failed' });
  }
};

module.exports = {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  toggleStatus, 
  launchPromotion,
};