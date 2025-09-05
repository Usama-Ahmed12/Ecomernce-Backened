const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { addToCart, getCart } = require('../controllers/cartController');

// ✅ Add product to cart
router.post('/add', auth, addToCart);

// ✅ Get user cart
router.get('/', auth, getCart);

module.exports = router;
