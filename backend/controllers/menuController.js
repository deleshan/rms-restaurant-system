const MenuItem = require('../models/MenuItem');
const mongoose = require('mongoose');
const { calculateMenuItemCost, calculatePriceFromMargin } = require('../utils/menuCosting.util');
const { convertQuantity } = require('../utils/unitConversion.util');

// @desc    Get menu items with search and filters
// @route   GET /api/menu
// @access  Public (Filter by Restaurant)
const getMenuItems = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || (req.user && req.user.restaurantId);
 
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }
 
    let query = { restaurantId };
    const { availability, search, category, station } = req.query;
 
    if (availability === 'available') {
      query.isAvailable = true;
      query.isOutOfStock = { $ne: true };
    } else if (availability === 'unavailable') {
      query.isAvailable = false;
    } else if (!req.user) {
      query.isAvailable = true;
      query.isOutOfStock = { $ne: true };
    }
 
    // Search logic
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
 
    // Category logic
    if (category && category !== 'all') {
      query.category = category;
    }

    // Station logic
    if (station && station !== 'all') {  
      query.station = station;
    }
 
    const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
    const totalCount = await MenuItem.countDocuments(query);
 
    res.status(200).json({
      success: true,
      items,
      totalCount,
      restaurantId
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const getMenuItemsForAdmin = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || (req.user && req.user.restaurantId);

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }

    let query = { restaurantId };
    const { availability, search, category, station } = req.query;

    if (availability === 'available') {
      query.isAvailable = true;
    } else if (availability === 'unavailable') {
      query.isAvailable = false;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category logic
    if (category && category !== 'all') {
      query.category = category;
    }

    // Station logic
    if (station && station !== 'all') {
      query.station = station;
    }

    const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
    const totalCount = await MenuItem.countDocuments(query);

    res.status(200).json({
      success: true,
      items,
      totalCount,
      restaurantId
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single menu item by ID
// @route   GET /api/menu/items/:id
// @access  Public (Filter by Restaurant)
const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Menu Item ID format'
      });
    }
    const isAdminRequest = !!req.user;
 
    const query = MenuItem.findById(id);

    const baseFields = 'name unit currentStock';
    const adminFields = 'name unit currentStock costPerUnit';
 
    if (isAdminRequest) {
      query
        .populate('ingredients.inventoryItem', 'name unit currentStock costPerUnit')
        .populate('customizationOptions.ingredientEffects.inventoryItem', 'name unit');
    } else {
      query
        .populate('ingredients.inventoryItem', 'name unit')
        .populate('customizationOptions.ingredientEffects.inventoryItem', 'name unit');
    }
 
    const menuItem = await query;
 
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    let maxMakeable = null;
    if (menuItem.ingredients && menuItem.ingredients.length > 0) {
      const ratios = [];
      for (const ing of menuItem.ingredients) {
        if (!ing.inventoryItem || !ing.quantityRequired || ing.quantityRequired <= 0) continue;

        let neededInStockUnit;
        try {
          neededInStockUnit = convertQuantity(ing.quantityRequired, ing.unit, ing.inventoryItem.unit);
        } catch (err) {
          console.warn(`Unit conversion failed for ingredient in "${menuItem.name}": ${err.message}`);
          continue;
        }

        if (neededInStockUnit > 0) {
          ratios.push(ing.inventoryItem.currentStock / neededInStockUnit);
        }
      }
      if (ratios.length > 0) {
        maxMakeable = Math.floor(Math.min(...ratios));
      }
    }
 
    res.status(200).json({
      success: true,
      item: menuItem,
      maxMakeable,
    });
  } catch (error) {
    console.error('Get menu item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu item'
    });
  }
};


// @desc    Create new menu item
// @route   POST /api/menu
// @access  Private (Admin only)
const createMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    
    const menuItem = new MenuItem({
      ...req.body,
      restaurantId,
      name: req.body.name.trim()
    });

    await menuItem.save();
    res.status(201).json({ success: true, item: menuItem });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A menu item with this name already exists' });
    }
    res.status(500).json({ message: 'Error creating menu item' });
  }
};

// @desc    Create new bulk menu items
// @route   POST /api/bulk-upload
// @access  Private (Admin only)
const bulkUploadMenuItems = async (req, res) => {
  try {
    const { items, restaurantId } = req.body; 

    const operations = items.map(item => ({
      updateOne: {
        filter: { 
          name: item.name, 
          restaurantId: restaurantId 
        },
        update: { 
          $set: {
            ...item,
            restaurantId, 
          }
        },
        upsert: true
      }
    }));

    const result = await MenuItem.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: `Processed ${items.length} items`,
      details: {
        upserted: result.upsertedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private (Admin only)
const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found or unauthorized' });
    }

    res.status(200).json({ success: true, item: menuItem });
  } catch (error) {
    res.status(500).json({ message: 'Error updating menu item' });
  }
};

// @desc    Toggle item availability (PATCH)
// @route   PATCH /api/menu/:id/availability
// @access  Private (Admin only)
const toggleAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { isAvailable },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ success: true, item: menuItem });
  } catch (error) {
    res.status(500).json({ message: 'Error updating availability' });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (Admin only)
const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item' });
  }
};

// @desc    Get unique categories for the restaurant
// @route   GET /api/menu/categories
// @access  Public/Private
const getMenuCategories = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || (req.user && req.user.restaurantId);
    const categories = await MenuItem.distinct('category', { restaurantId });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

/**
 * @desc    Calculate current ingredient cost + suggested price for a menu item
 * @route   GET /api/menu/:id/price-calculator?margin=30
 */
const getMenuItemPriceCalculation = async (req, res) => {
  try {
    const { id } = req.params;
    const { margin } = req.query;

    const menuItem = await MenuItem.findOne({ _id: id, restaurantId: req.user.restaurantId }).select('name price');
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const costResult = await calculateMenuItemCost(id);

    let suggestedPrice = null;
    let exactSuggestedPrice = null;
    let projectedMargin = null;

    if (margin !== undefined) {
      const result = calculatePriceFromMargin(costResult.totalCost, Number(margin));
      suggestedPrice = result.rounded;
      exactSuggestedPrice = result.exact;
    }
    if (menuItem.price > 0) {
      projectedMargin = +(((menuItem.price - costResult.totalCost) / menuItem.price) * 100).toFixed(1);
    }

    res.status(200).json({
      success: true,
      menuItemName: menuItem.name,
      currentPrice: menuItem.price,
      currentMargin: projectedMargin,
      cost: costResult.totalCost,
      breakdown: costResult.breakdown,
      hasMissingCostData: costResult.hasMissingCostData,
      suggestedPrice,
      exactSuggestedPrice,
      requestedMargin: margin !== undefined ? Number(margin) : null,
    });
  } catch (error) {
    console.error('Price calculator error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Apply the calculated price to the menu item
 * @route   PATCH /api/menu/:id/price
 */
const updateMenuItemPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    if (!price || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid price is required' });
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: id, restaurantId: req.user.restaurantId },
      { $set: { price: Number(price) } },
      { returnDocument: 'after' }
    );

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.status(200).json({ success: true, item: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};