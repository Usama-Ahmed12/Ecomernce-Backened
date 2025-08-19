const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { addToCart, getCart } = require('../controllers/cartController');

// ✅ Add product to cart
router.post('/add', protect, addToCart);

// ✅ Get user cart
router.get('/', protect, getCart);

module.exports = router;
