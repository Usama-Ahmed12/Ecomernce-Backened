const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders } = require('../controllers/orderController');
const { auth } = require('../middleware/authMiddleware');

// ✅ Protected route to create order
router.post('/create', auth, createOrder);

// ✅ Get orders for logged-in user
router.get('/my-orders', auth, getUserOrders);

module.exports = router;
