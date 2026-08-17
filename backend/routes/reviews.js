const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  submitReview,
  getReviews,
  updateReview,
  replyToReview, 
  toggleFlag,
  analyzeReviewSentiment,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/auth');

// Multer for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reviews/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'review-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  },
});
const upload = multer({ storage });

// Public route
router.post('/', upload.single('photo'), submitReview);

// Protected routes (admin)
router.use(protect);
router.use(restrictTo('admin'));

router.get('/', getReviews);
router.put('/:id', updateReview);
router.post('/:id/reply', replyToReview); 
router.patch('/:id/flag', toggleFlag);    
router.post('/analyze-sentiment', analyzeReviewSentiment);

module.exports = router;