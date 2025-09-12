const express = require("express");
const router = express.Router();
const { getAllProducts, addProduct } = require("../controllers/productController");
const uploadAnyImage = require("../middleware/uploadMiddleware"); // ✅ correct path
const { authenticate, authorize } = require("../middleware/authMiddleware");

// GET all products (open for all users)
router.get("/", getAllProducts);

// POST product (only admin can add)
router.post("/", authenticate, authorize(["admin"]), uploadAnyImage(), addProduct);

module.exports = router;
