const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshToken } = require('../controllers/authController');

// ✅ Register new user
router.post('/register', registerUser);

// ✅ Login user
router.post('/login', loginUser);

// ✅ Refresh token
router.post('/refresh', refreshToken);

module.exports = router;
