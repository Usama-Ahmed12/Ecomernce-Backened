const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  verifyEmail, 
  loginUser, 
  logoutUser,          // ✅ added logout
  refreshToken,
  resendVerificationEmail
} = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', registerUser);

// GET  /api/auth/verify/:token
router.get('/verify/:token', verifyEmail);

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/logout   new route
router.post('/logout', logoutUser);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;
