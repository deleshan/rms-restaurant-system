const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getMenuCategories,
  bulkUploadMenuItems,
  getMenuItemsForAdmin,
  getMenuItemPriceCalculation,
  updateMenuItemPrice,
} = require('../controllers/menuController');
const { getMenuItemInsight } = require('../controllers/aiController');
const { updateMenuItemIngredients } = require('../controllers/inventoryController')
const aiController = require('../controllers/aiController')
const { protect, restrictTo } = require('../middleware/auth');

/**
 * PUBLIC ROUTES
 * These can be accessed by both Admin and Customer apps
 */

// Matches: GET /api/menu/items
router.get('/items', getMenuItems);



// Matches: GET /api/menu/categories
router.get('/categories', getMenuCategories);

/**
 * PROTECTED ROUTES
 * Only Admins can modify the menu
 */
router.use(protect);
router.use(restrictTo('admin'));

router.get('/items-admin', getMenuItemsForAdmin);
// Matches: GET /api/menu/items/:id
router.get('/items/:id', getMenuItemById);

// Matches: POST /api/menu/items
router.post('/items/bulk-upload', bulkUploadMenuItems);
router.post('/items', createMenuItem);

// Matches: PUT /api/menu/items/:id
router.put('/items/:id', updateMenuItem);

router.put('/:id/ingredients', updateMenuItemIngredients);

// Matches: PATCH /api/menu/items/:id/availability
router.patch('/items/:id/availability', toggleAvailability);

// Matches: DELETE /api/menu/items/:id
router.delete('/items/:id', deleteMenuItem);
router.get('/:itemId/insight', getMenuItemInsight);

// Matches: GET /api/menu/:id/price-calculator
router.get('/:id/price-calculator', getMenuItemPriceCalculation);
router.patch('/:id/price', updateMenuItemPrice);

module.exports = router;