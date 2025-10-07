const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, markOrderPaid } = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

// ✅ Create order
router.post('/create', authenticate, createOrder);

// ✅ Get all orders of logged-in user
router.get('/my-orders', authenticate, getUserOrders);

// ✅ Mark order as Paid
router.put('/:id/pay', authenticate, markOrderPaid);

module.exports = router;
