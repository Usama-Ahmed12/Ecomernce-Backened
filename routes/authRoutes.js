const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  verifyEmail, 
  loginUser, 
  refreshToken,
  resendVerificationEmail //  add this
} = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', registerUser);

// GET  /api/auth/verify/:token
router.get('/verify/:token', verifyEmail);

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/resend-verification  New Route
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;
