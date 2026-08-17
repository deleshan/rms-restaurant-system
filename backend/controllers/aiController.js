const axios = require('axios');
const Review = require('../models/Review');
const MenuItem = require('../models/MenuItem');

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:5001';

exports.getMenuItemInsight = async (req, res) => {
  try {
    const { itemId } = req.params;

    const menuItem = await MenuItem.findById(itemId);
    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const reviews = await Review.find({
      [`itemRatings.${itemId}`]: { $exists: true },
      feedback: { $ne: "" }
    });

    if (!reviews || reviews.length === 0) {
      return res.json({
        suggestion: "No specific feedback found for this item yet.",
        status: "neutral",
        count: 0
      });
    }

    const reviewTexts = reviews.map(r => r.feedback);

    const aiResponse = await axios.post(`${PYTHON_AI_URL}/analyze-menu-item`, {
      reviews: reviewTexts,
      itemName: menuItem.name  
    });

    res.status(200).json({
      ...aiResponse.data,
      reviewCount: reviews.length
    });

  } catch (error) {
    console.error("AI Insight Error:", error.message);
    res.status(500).json({ error: "AI Service unreachable. Check if Flask is running on port 5001." });
  }
};