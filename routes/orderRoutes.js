const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// ✅ Protected route to create order
router.post('/create', protect, createOrder);

// ✅ Get orders for logged-in user
router.get('/my-orders', protect, getUserOrders);

module.exports = router;
