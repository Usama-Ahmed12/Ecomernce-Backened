// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { registerUser, loginUser } = require("../controllers/authController");
const { getUserProfile, deleteUser } = require("../controllers/userController");

// ✅ Register route
router.post("/register", registerUser);

// ✅ Login route
router.post("/login", loginUser);

// ✅ Profile route (Protected)
router.get("/profile", authenticate, getUserProfile);

// ✅ User khud apna account delete kare
router.delete("/delete", authenticate, deleteUser);

// ✅ Admin kisi bhi user ko delete kare (id ke sath)
router.delete("/delete/:email", authenticate, deleteUser);

module.exports = router;
