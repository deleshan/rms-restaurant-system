const Review = require('../models/Review');
const Order = require('../models/Order');
const axios = require('axios');
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');


const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:5001';

/**
 * @desc    Submit review from customer
 * @route   POST /api/reviews
 * @access  Public
 */
const submitReview = async (req, res) => {
  try {
    // Extract values 
    const { orderId, serviceRating, foodItemRatings, feedback, rating } = req.body;
    let photo = '';

    if (req.file) {
      photo = `/uploads/reviews/${req.file.filename}`;
    }

    // Parse food ratings
    let parsedFoodRatings = {};
    try {
      parsedFoodRatings = foodItemRatings ? JSON.parse(foodItemRatings) : {};
    } catch (e) {
      console.error("Failed to parse foodItemRatings:", e);
    }

    // Validation
    if (!orderId || !serviceRating) {
      return res.status(400).json({ message: 'Order ID and service rating are required' });
    }

    // Verify Order
    const order = await Order.findById(orderId).populate('user'); 
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const existingReview = await Review.findOne({ orderId });
    if (existingReview) return res.status(400).json({ message: 'Review already exists for this order' });

    // Calculate Food Average for internal safety
    const foodVals = Object.values(parsedFoodRatings);
    const calculatedFoodAvg = foodVals.length > 0 
      ? (foodVals.reduce((a, b) => a + b, 0) / foodVals.length)
      : 5;

    // Build the Review Object
    const review = new Review({
      orderId,
      restaurantId: order.restaurantId,
      customer: {
        customerId: order.user?._id || order.user || null,
        name: order.user?.name || "Guest Customer",
        phone: order.user?.phone || "N/A",
      },
      itemRatings: parsedFoodRatings,
      foodRating: Number(calculatedFoodAvg), 
      serviceRating: Number(serviceRating),
      rating: Number(rating || ((calculatedFoodAvg + Number(serviceRating)) / 2)),
      feedback: feedback?.trim() || '',
      photo,
    });
    if (review.feedback && review.feedback.length > 2) {
      try {
        const response = await axios.post(`${PYTHON_AI_URL}/analyze-sentiment`, {
          text: review.feedback,
        }, { timeout: 2000 });

        if (response.data) {
          const label = response.data.sentiment || 'Neutral';
          review.sentimentLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
          review.sentimentScore = response.data.score || 0;
          review.keywords = response.data.keywords || [];
        }
      } catch (aiError) {
        console.error('[AI Service Error]: AI is likely offline. Saving review with Neutral sentiment.');
        review.sentimentLabel = 'Neutral';
      }
    }

    await review.save();
    res.status(201).json({ success: true, message: 'Review submitted successfully', review });

  } catch (error) {
   
    console.error('Submit review error details:', error);
    res.status(500).json({ message: 'Server error while submitting review', error: error.message });
  }
};


/**
 * @desc    Get reviews for admin dashboard (with filters)
 * @route   GET /api/reviews
 * @access  Private (Admin)
 */
const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, rating, status } = req.query;
    
    // Build the Query Object
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);
    let query = { restaurantId: restaurantId };

    // Dashboard Search Logic
    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { feedback: { $regex: search, $options: 'i' } }
      ];
      
      if (mongoose.isValidObjectId(search)) {
        query.$or.push({ orderId: search });
      }
    }

    // Filters
    if (rating && rating !== 'all') query.rating = Number(rating);
    if (status === 'flagged') query.isFlagged = true;
    if (status === 'pending') query.repliedAt = null; 
    if (status === 'replied') query.repliedAt = { $ne: null };

    // Execute Data Fetch and Total Count in Parallel
    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      Review.countDocuments(query)
    ]);

    // Optimized Aggregation for Stats
    // We match against the casted ObjectId 'restaurantId'
    const statsAggregation = await Review.aggregate([
      { $match: { restaurantId: restaurantId } }, 
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: '$rating' },
          total: { $sum: 1 },
          flaggedCount: { $sum: { $cond: ["$isFlagged", 1, 0] } },
          pendingCount: { 
            $sum: { 
              $cond: [
                { $or: [
                  { $eq: ["$repliedAt", null] }, 
                  { $not: ["$repliedAt"] }
                ]}, 
                1, 0
              ] 
            } 
          }
        } 
      }
    ]);

    // Handle Empty State and Format
    const result = statsAggregation[0] || { avgRating: 0, total: 0, flaggedCount: 0, pendingCount: 0 };

    const stats = {
      totalReviews: result.total,
      averageRating: Number(result.avgRating || 0).toFixed(1),
      pendingReplies: result.pendingCount,
      flagged: result.flaggedCount
    };

    // Final Response
    res.status(200).json({ 
      reviews, 
      totalCount, 
      stats 
    });

  } catch (error) {
    console.error("GetReviews Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Specialized Reply Method
const replyToReview = async (req, res) => {
  const { replyText } = req.body;
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { adminReply: replyText, repliedAt: new Date() },
    { new: true }
  );
  res.status(200).json({ success: true, review });
};

// Specialized Flag Method
const toggleFlag = async (req, res) => {
  const { isFlagged } = req.body;
  const review = await Review.findByIdAndUpdate(
    req.params.id, 
    { isFlagged }, 
    { new: true }
  );
  res.status(200).json({ success: true, review });
};

/**
 * @desc    Admin reply to review or hide it
 * @route   PUT /api/reviews/:id
 * @access  Private (Admin)
 */
const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const restaurantId = req.user.restaurantId;
    const { adminReply, isHidden } = req.body;

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, restaurantId },
      {
        $set: {
          adminReply: adminReply?.trim() || '',
          repliedByAdmin: !!adminReply,
          isHidden: isHidden === true,
        },
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Run AI Sentiment Analysis via Python Flask Service
 * @route   POST /api/reviews/analyze-sentiment
 * @access  Private (Admin Only)
 */
const analyzeReviewSentiment = async (req, res) => {
  try {
    // Identify the Restaurant context
    const restaurantId = req.user.restaurantId; 

    // Fetch reviews and your Menu Items
    // We need menu item names so the AI knows which specific foods to look for
    const [reviews, menuItems] = await Promise.all([
      Review.find({ 
        restaurantId, 
        $or: [
          { feedback: { $ne: "" } }, 
          { comment: { $ne: "" } }
        ] 
      }),
      MenuItem.find({ restaurantId }).distinct('name')
    ]);

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No text-based reviews found for analysis." 
      });
    }

    // Prepare data for the Python AI Service
    // We send the reviews AND the list of menu items for sentence-level matching
    const analysisData = {
      reviews: reviews.map(r => ({
        id: r._id,
        text: r.feedback || r.comment 
      })),
      menuItems: menuItems 
    };

    // Call Python Flask Server (Port 5001)
    const pythonResponse = await axios.post(`${PYTHON_AI_URL}/analyze`, analysisData);

    // Bulk Update MongoDB with the new foodAnalysis results
    const updatePromises = pythonResponse.data.results.map(item => {
      return Review.findByIdAndUpdate(item.id, {
        $set: {
          sentimentLabel: item.label,   // 'Positive', 'Neutral', 'Negative'
          sentimentScore: item.score,   // -1 to 1 range
          keywords: item.keywords || [],
          foodAnalysis: item.foodAnalysis || [] // The dish-specific breakdown
        }
      });
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `AI Intelligence successfully processed ${reviews.length} reviews with dish-level breakdown.`,
    });

  } catch (error) {
    console.error("AI Sentiment Analysis Error:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        success: false, 
        message: "AI Backend (Python) is offline on port 5001." 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "AI communication error: " + error.message 
    });
  }
};


module.exports = {
  submitReview,
  getReviews,
  updateReview,
  replyToReview, 
  toggleFlag,
  analyzeReviewSentiment,
};