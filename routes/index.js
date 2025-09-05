const express = require('express');
const router = express.Router();

// ✅ Import all route files
//const authRoutes = require('./authRoutes');
//const userRoutes = require('./userRoutes');
//const productRoutes = require('./productRoutes');
//const cartRoutes = require('./cartRoutes');
//const orderRoutes = require('./orderRoutes');

// ✅ import ++ direct Mount routes
router.use('/auth', require('./authRoutes'));
router.use('/users',require('./userRoutes'));
router.use('/products',require('./productRoutes'));
router.use('/cart',require('./cartRoutes'));
router.use('/orders',require('./orderRoutes'));

module.exports = router;
