const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/pending', reviewController.getPendingReviews);
router.post('/submit', reviewController.submitReview);

module.exports = router;
