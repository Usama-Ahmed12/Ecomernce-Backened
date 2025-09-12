// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { addToCart, getCart } = require('../controllers/cartController');

// ✅ Add product to cart (protected route)
router.post('/add', authenticate, addToCart);

// ✅ Get user cart (protected route)
router.get('/', authenticate, getCart);

module.exports = router;
