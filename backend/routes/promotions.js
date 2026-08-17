const express = require('express');
const router = express.Router();
const {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  toggleStatus,
  launchPromotion,
} = require('../controllers/promotionController');
const { protect, restrictTo } = require('../middleware/auth');

// All promotion management routes require authentication and admin privileges
router.use(protect);
router.use(restrictTo('admin'));

// COLLECTION ROUTES

// @route   GET /api/promotions (Supports ?search= and ?status=)
// @route   POST /api/promotions
router.route('/')
  .get(getPromotions)
  .post(createPromotion);

// INDIVIDUAL ITEM ROUTES

// @route   PUT /api/promotions/:id (Full update)
// @route   DELETE /api/promotions/:id
router.route('/:id')
  .put(updatePromotion)
  .delete(deletePromotion);


// SPECIALIZED ACTIONS

// @route   PATCH /api/promotions/:id/status
// Explicitly for the toggle switch on the dashboard to prevent full record updates
router.patch('/:id/status', toggleStatus);

// @route   POST /api/promotions/:id/launch
// Triggers the Twilio SMS and Mailchimp email campaign logic
router.post('/:id/launch', launchPromotion);

module.exports = router;