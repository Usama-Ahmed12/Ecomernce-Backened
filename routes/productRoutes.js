const express = require('express');
const router = express.Router();
const { getAllProducts, addProduct } = require('../controllers/productController');

// ✅ GET all products
router.get('/', getAllProducts);

// ✅ POST new product
router.post('/', addProduct);

module.exports = router;
