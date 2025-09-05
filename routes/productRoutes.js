const express = require("express");
const router = express.Router();
const { getAllProducts, addProduct } = require("../controllers/productController");
const uploadAnyImage = require("../middleware/uploadMiddleware");

// GET all products
router.get("/", getAllProducts);

// POST product with any image field
router.post("/", uploadAnyImage(), addProduct);

module.exports = router;
