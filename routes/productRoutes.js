const express = require('express');
const router = express.Router();
const { getAllProducts, addProduct, upload } = require('../controllers/productController');

// ✅ GET all products
router.get('/', getAllProducts);

// ✅ POST new product with image
router.post('/', upload.single('image'), addProduct);

module.exports = router;
