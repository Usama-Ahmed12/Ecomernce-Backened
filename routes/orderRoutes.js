const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders } = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

// ✅ Protected route to create order
router.post('/create', authenticate, createOrder);

// ✅ Get orders for logged-in user
router.get('/my-orders', authenticate, getUserOrders);

module.exports = router;
